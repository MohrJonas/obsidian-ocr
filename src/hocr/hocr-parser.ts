import Hocr from "./hocr";

export default function parseHocr(original_file: string, text: string): Hocr {
	return Hocr.from_HTML(original_file, new DOMParser().parseFromString(text, "text/html"));
}