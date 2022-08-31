export default class BoundingBox {

	constructor(public readonly x1: number, public readonly y1: number, public readonly x2: number, public readonly y2: number) {
	}

	static fromTitle(title: string): BoundingBox {
		const parts = title.split(" ");
		return new BoundingBox(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]), parseInt(parts[4]));
	}
}
