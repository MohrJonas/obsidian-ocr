/**
 * Base interface for all OCR providers
 * */
export default abstract class OCRProvider {

	/**
     * Get the display name of the provider
     * @return A human-friendly name of the provider
     * */
	abstract getProviderName(): string;

	/**
     * Check if the provider is usable.
     * @description Depending on the provider, this might be always true, depend on an installed program or an internet connection
     * @return true, if the provider can be used, false otherwise
     * */
	abstract isUsable(): Promise<boolean>;

	/**
     * Get why the provider isn't usable
     * @return A human-friendly explanation why this provider can currently not be used
     * */
	abstract getReasonIsUnusable(): Promise<string | undefined>;

	/**
     * Display the settings for the provider
     * @param element The HTMLElement to display the settings on
     * */
	abstract displaySettings(element: HTMLElement): void;

	/**
     * Perform the actual OCR process
     * @param imagePaths An array of images that should be OCRed
     * @return An array of strings that represent the results for each page OCRed, or undefined if an error occurred while performing OCR
     * @description The returned array should always have the same length as the provided array.
     * @description If even just one path fails to process, the entire function should return undefined
     * */
	abstract performOCR(imagePaths: Array<string>): Promise<Array<string> | undefined>

}
