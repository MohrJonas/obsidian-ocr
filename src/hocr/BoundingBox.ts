

/**
 * In-code representation of a hocr bounding box
 * @see {@link HocrElement} for further explanation
 * */
export default class BoundingBox {

	/**
	 * The bounding box is a rectangle defined by two points, the lower-left and upper-right corner
	 * @param x1 x-coordinate of the lower-left corner
	 * @param y1 y-coordinate of the lower-left corner
	 * @param x2 x-coordinate of the upper-right corner
	 * @param y2 y-coordinate of the upper-right corner
	 * */
	constructor(public readonly x1: number, public readonly y1: number, public readonly x2: number, public readonly y2: number) {
	}

	/**
	 * Parse the coordinated of the bounding box from the hocr title
	 * @param title the title to parse from
	 * @return a BoundingBox with the associated coordinates
	 * */
	static fromTitle(title: string): BoundingBox {
		const parts = title.split(" ");
		return new BoundingBox(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]), parseInt(parts[4]));
	}
}
