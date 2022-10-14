import OCRProvider from "../OCRProvider";

//TODO only for testing delete before shipping
export default class UnusableOCRProvider extends OCRProvider {

    getProviderName(): string {
        return "Unusable";
    }
    async isUsable(): Promise<boolean> {
        return false;
    }
    async getReasonIsUnusable(): Promise<string> {
        return "This Provider is never usable"
    }
    displaySettings(element: HTMLElement): void {

    }
    async performOCR(imagePaths: string[]): Promise<string[]> {
        return []
    }

}