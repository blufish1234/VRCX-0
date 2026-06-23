# <img src="images/VRCX-0.png" alt="logo" width="23">   VRCX-0

English | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-Hant.md) | [日本語](README.ja-JP.md) | [한국어](README.ko-KR.md)

VRCX-0 is a rewrite of VRCX, rebuilt from the previous CefSharp + Vue architecture with **Tauri + React**. It is developed by one of VRCX's former maintainers.

VRCX-0 focuses on players' everyday use: lower resource usage, a smaller app, and continued feature development and support.

The current VRCX project is already largely stable, with future upstream changes likely to focus mainly on maintenance and fixes rather than major changes. VRCX-0 will continue feature development and support while moving forward with its own roadmap.

## Highlights

- About 50%–70% lower memory usage compared to VRCX
- Background mode keeps core services running with only a few dozen MB of memory usage
- Windows and macOS installers are in the 20 MB range, and much smaller application size
- New UI and interaction model
- Better application launcher, featuring a dedicated panel and more specific settings. 
- Custom themes, with support of community themes and custom CSS layer
- Full keyboard navigation
- Headless mode
- Continued feature development and support

## Features

- Keep track of your VRChat friends' locations

## Data Migration

On first run, VRCX-0 can automatically migrate your existing VRCX database and settings.

Your original VRCX data is not modified.
Existing users can start using VRCX-0 with their current data without any manual setup.

## VROverlay

VROverlay support is planned.

It will be redesigned around practical use cases instead of directly reusing the old implementation.

## License

The initial commit of this repository corresponds to the upstream VRCX snapshot at the time of the fork and is licensed under the MIT License.

All modifications, additions, rewrites, and new code introduced after the fork are licensed under the GNU General Public License v3.0 (GPLv3).

## Installation

**All Operating Systems**

 - [Via GitHub Releases](https://github.com/Map1en/VRCX-0/releases)

**Windows**

- WinGet

    ```ps
    winget install vrcx-0
    ```

**Linux**
- AUR 

    *Packaged by BlackCherry*
    ```bash
    yay -S vrcx-0-bin
    ```

## Development

Requirements:

- Node.js LTS
- Latest stable Rust toolchain via rustup

```bash
git clone https://github.com/Map1en/VRCX-0
cd VRCX-0

npm install
npm run tauri:dev
```

*VRCX-0 is not endorsed by VRChat and does not reflect the views or opinions of VRChat or anyone officially involved in producing or managing VRChat properties. VRChat and all associated properties are trademarks or registered trademarks of VRChat Inc. VRChat © VRChat Inc.*