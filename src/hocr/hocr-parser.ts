import HocrPage from "./hocr-page";

export default function parseHocr(text: string): HocrPage {
	return HocrPage.from_HTML(new DOMParser().parseFromString(text, "text/html"));
}