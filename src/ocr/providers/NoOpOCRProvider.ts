import OCRProvider from "../OCRProvider";

/**
 * No-operation implementation of {@link OCRProvider}
 * */
export default class NoOpOCRProvider implements OCRProvider {

	public getProviderName(): string {
		return "NoOp";
	}

	displaySettings(element: HTMLElement): void {
		element.createEl("div", {text: "NoOp-Provider (No Operation) doesn't do anything. Choose another provider from the dropdown."});
	}

	async performOCR(): Promise<Array<string> | undefined> {
		// language=HTML
		return [`
			<?xml version="1.0" encoding="UTF-8"?>
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
				"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
			<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
			<head>
				<title></title>
				<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
				<meta name='ocr-capabilities' content=''/>
			</head>
			<body>
			</body>
			</html>
		`];
	}

	async isUsable(): Promise<boolean> {
		return true;
	}

	getReasonIsUnusable(): undefined {
		return undefined;
	}

}
