![Obsidian](https://img.shields.io/badge/Obsidian-%23483699.svg?style=for-the-badge&logo=obsidian&logoColor=white)  
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
![WebStorm](https://img.shields.io/badge/webstorm-143?style=for-the-badge&logo=webstorm&logoColor=white&color=black)  
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![macOS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)

# Obsidian OCR

Obsidian OCR allows you to search for text in your images and pdfs

## Installation

### Dependency installation

#### Dependencies

- `tesseract` for OCR
- `graphicsmagick` + `ghostscript` for pdf to png conversion

#### Windows

❗Make sure the executables are in your path. If you don't know how look
here❗: <https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/>

- Install `tesseract` from <https://github.com/UB-Mannheim/tesseract/wiki>
- Install `graphicsmagick` from <https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/>  
  ⚠ I had problems with the latest version 1.3.36, so I used 1.3.35 instead ⚠
- Install `ghostscript` from <https://ghostscript.com/releases/gsdnld.html>  
  ⚠ I had problems with graphicsmagick being unable to find ghostscript. This fixed it for me ⚠:
  <https://github.com/GenericMappingTools/gmt/issues/4231#issuecomment-868127347>

#### MacOS

- Install tesseract: `brew install tesseract`
- Install tesseract-lang : `brew install tesseract-lang`
- Install graphicsmagick : `brew install graphicsmagick`
- Install imagemagick : `brew install imagemagick`
- Install ghostscript : `brew install ghostscript`

For the path: check where the binaries are located and add these to "/private/etc/paths"
(I also added them to ~/.zshrc, not sure if that is needed)

- `brew list tesseract`  in my case: `/opt/homebrew/Cellar/tesseract/5.2.0/bin/`
- `brew list tesseract-lang` in my case: `/opt/homebrew/Cellar/tesseract/5.2.0/bin/`
- `brew list graphicsmagick` in my case: `/opt/homebrew/Cellar/graphicsmagick/1.3.38/bin/`
- `brew list imagemagick` in my case: `/opt/homebrew/Cellar/imagemagick/7.1.0-43/bin/`
- `brew list ghostscript` in my case: `/opt/homebrew/Cellar/ghostscript/9.56.1/bin/`

#### Ubuntu

- Run `sudo apt install -y tesseract-ocr graphicsmagick ghostscript`
- Install any languages you need by installing the appropriate package (usually named `tesseract-ocr-<lang>`)

#### Arch / Manjaro

- Run `sudo pacman -S tesseract graphicsmagick ghostscript`
- Install any languages you need by installing the appropriate package (usually named `tesseract-data-<lang>`)

**Note**:  
If Obsidian is running via the Flatpak installation (such as provided by default in Pop!_OS), then this plugin
will not work. Flatpak's sandboxing will change the filepaths, so even providing host access will be problematic.
If you have a Flatpak installation you will need to reinstall via a different method to successfully use this plugin.

### Plugin installation

At the moment, this plugin is not yet available via the community plugins.

#### BRAT installation

You can install the plugin by using [BRAT](https://github.com/TfTHacker/obsidian42-brat).  
Simply install the BRAT plugin
and add `https://github.com/MohrJonas/obsidian-ocr` as a beta plugin.

#### Manual installation

Download `main.js`, `styles.css` and `manifest.json` from the latest release and move it
into `<VaultPath>/.obsidian/plugins/obsidian-ocr`, creating folders as necessary.

## Usage

- On startup / when adding a new file, the file is automatically getting searched for text.
- Use the `magnifying glass` in the ribbon / the `Search OCR` command to perform the search.
