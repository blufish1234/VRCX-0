//! Lightweight intent routing: a matched query narrows the visible tool set and
//! injects a focused constraint, steering a weak model onto one aggregate tool
//! instead of free-planning across the whole toolset. A keyword fast-path runs
//! first; on a miss, a stateless side-channel LLM call matches the intent
//! semantically in any language. Unmatched queries fall through to the normal
//! agent loop.

use vrcx_0_integrations::llm::{ChatMessage, LlmClient, ToolDefinition};

#[derive(Clone, Copy)]
pub(crate) struct Playbook {
    tool_whitelist: &'static [&'static str],
    constraint_prompt: &'static str,
}

impl Playbook {
    pub(crate) fn constraint_prompt(&self) -> &'static str {
        self.constraint_prompt
    }

    pub(crate) fn filter_tools(&self, tools: &[ToolDefinition]) -> Vec<ToolDefinition> {
        tools
            .iter()
            .filter(|tool| self.tool_whitelist.contains(&tool.name.as_str()))
            .cloned()
            .collect()
    }
}

struct Intent {
    label: &'static str,
    description: &'static str,
    keywords: &'static [&'static str],
    playbook: Playbook,
}

const FRIEND_CIRCLES: Playbook = Playbook {
    tool_whitelist: &["get_friend_circles"],
    constraint_prompt: "The user is asking which of their friends know each other (friend \
groups / circles). Call get_friend_circles exactly once; it returns ready-made \
mutual-friendship circles with a summary. Narrate from that summary and the circle rows — \
do NOT attempt graph reasoning yourself. Circles reflect who is friends with whom (mutual \
connections), which is not the same as who plays together.",
};

const INTENTS: &[Intent] = &[Intent {
    label: "circles",
    description: "which of the user's own friends know each other; friend groups or \
mutual-friendship clusters",
    keywords: &[
        "friend group",
        "friend circle",
        "know each other",
        "knows who",
    ],
    playbook: FRIEND_CIRCLES,
}];

pub(crate) fn classify_keyword(user_text: &str) -> Option<Playbook> {
    let text = user_text.to_lowercase();
    INTENTS
        .iter()
        .find(|intent| intent.keywords.iter().any(|keyword| text.contains(keyword)))
        .map(|intent| intent.playbook)
}

/// One non-streaming LLM call over an independent message list to match the
/// intent semantically in any language. It never enters the main conversation
/// history and emits no events; any error or no-match returns None so the caller
/// falls back to the full toolset.
pub(crate) async fn classify_llm(client: &LlmClient, user_text: &str) -> Option<Playbook> {
    let messages = vec![
        ChatMessage::system(classify_prompt()),
        ChatMessage::system("/no_think"),
        ChatMessage::user(user_text.to_string()),
    ];
    let turn = match client.stream_chat(&messages, &[], |_| {}).await {
        Ok(turn) => turn,
        Err(error) => {
            tracing::warn!(%error, "assistant: intent classify call failed");
            return None;
        }
    };
    matched_intent(&turn.content).map(|intent| intent.playbook)
}

fn classify_prompt() -> String {
    let mut prompt = String::from(
        "Classify a VRChat social assistant user's question into one intent. The question may \
be in any language. Reply with EXACTLY ONE label from the list below, or `none` if none fit. \
Output only the label.\n\nIntents:\n",
    );
    for intent in INTENTS {
        prompt.push_str("- ");
        prompt.push_str(intent.label);
        prompt.push_str(": ");
        prompt.push_str(intent.description);
        prompt.push('\n');
    }
    prompt
}

fn matched_intent(output: &str) -> Option<&'static Intent> {
    let lowered = output.to_lowercase();
    let trimmed = lowered.trim_matches(|c: char| !c.is_ascii_alphanumeric() && c != '_');
    INTENTS
        .iter()
        .find(|intent| intent.label == trimmed)
        .or_else(|| {
            INTENTS
                .iter()
                .filter(|intent| lowered.contains(intent.label))
                .min_by_key(|intent| lowered.find(intent.label).unwrap_or(usize::MAX))
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tool(name: &str) -> ToolDefinition {
        ToolDefinition {
            name: name.to_string(),
            description: String::new(),
            parameters: serde_json::Value::Null,
        }
    }

    #[test]
    fn keyword_matches_circle_phrasings() {
        assert!(classify_keyword("which of my friends know each other?").is_some());
        assert!(classify_keyword("show me my friend groups").is_some());
    }

    #[test]
    fn keyword_ignores_other_questions() {
        assert!(classify_keyword("who is online now").is_none());
        assert!(classify_keyword("who knows where alice went").is_none());
        assert!(classify_keyword("我的好友圈").is_none());
    }

    #[test]
    fn matched_intent_parses_label_leniently() {
        assert_eq!(
            matched_intent("circles").map(|intent| intent.label),
            Some("circles")
        );
        assert_eq!(
            matched_intent("The intent is circles.").map(|intent| intent.label),
            Some("circles")
        );
        assert!(matched_intent("none").is_none());
        assert!(matched_intent("copresence").is_none());
    }

    #[test]
    fn whitelist_keeps_only_circles() {
        let tools = vec![tool("get_friend_circles"), tool("get_social_graph")];
        let filtered = classify_keyword("which of my friends know each other")
            .unwrap()
            .filter_tools(&tools);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].name, "get_friend_circles");
    }
}
