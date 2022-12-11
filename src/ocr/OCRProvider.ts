export default abstract class OCRProvider {

	abstract getProviderName(): string;

	abstract isUsable(): Promise<boolean>;

	abstract getReasonIsUnusable(): Promise<string | undefined>;

	abstract displaySettings(element: HTMLElement): void;

	abstract performOCR(imagePaths: Array<string>): Promise<Array<string> | undefined>

}
