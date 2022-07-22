# **⚠️ Still in early development ⚠️**
## Obsidian OCR
Obsidian OCR allows you to search for text in your images and pdfs
### Dependencies
- `tesseract` for OCR
- `graphicsmagick` as well as `ghostscript` for pdf to png conversion

#### Dependency installation
##### Windows
❗Make sure the executables are in your path. If you don't know how look here: <https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/>❗
- Install `tesseract` from <https://github.com/UB-Mannheim/tesseract/wiki>
- Install `graphicsmagick` from <https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/>  
⚠ I had problems with the latest version 1.3.36, so I used 1.3.35 instead ⚠
- Install `ghostscript` from <https://ghostscript.com/releases/gsdnld.html>
⚠ I had problems with graphicsmagick being unable to find ghostscript. This fixed it for me: <https://github.com/GenericMappingTools/gmt/issues/4231#issuecomment-868127347> ⚠

##### MacOS
- Install tesseract: `brew install tesseract`
- Install tesseract-lang : `brew install tesseract-lang`
- Install graphicsmagick : `brew install graphicsmagick`
- Install imagemagick : `brew install imagemagick`
- Install ghostscript : `brew install ghostscript`

For the path: check where the binaries are located:
- `brew list tesseract`  in my case: `/opt/homebrew/Cellar/tesseract/5.2.0/bin/`
- `brew list tesseract-lang` in my case: `/opt/homebrew/Cellar/tesseract/5.2.0/bin/`
- `brew list graphicsmagick` in my case: `/opt/homebrew/Cellar/graphicsmagick/1.3.38/bin/`
- `brew list imagemagick` in my case: `/opt/homebrew/Cellar/imagemagick/7.1.0-43/bin/`
- `brew list ghostscript` in my case: `/opt/homebrew/Cellar/ghostscript/9.56.1/bin/`

##### Ubuntu
- Run `sudo apt install -y tesseract-ocr graphicsmagick ghostscript`
- Install any languages you need by installing the appropriate package (usually named `tesseract-ocr-<lang>`)
##### Arch / Manjaro
- Run `sudo pacman -S tesseract graphicsmagick ghostscript`
- Install any languages you need by installing the appropriate package (usually named `tesseract-data-<lang>`)
### Usage
- On startup / when adding a new file the file is automatically getting searched for text.
- Use the `magnifying glass` in the ribbon / the `Search OCR` command to perform the search.
