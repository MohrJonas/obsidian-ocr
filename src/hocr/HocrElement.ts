import BoundingBox from "./BoundingBox";

/**
 * Base class for in-code representation of hocr elements
 * @description hocr is an open, HTML-like syntax to represent OCR results.
 * See {@link https://wikipedia.org/wiki/HOCR} for more information
 * */
interface HocrElement {

    /**
     * The bounds of the element. All elements, except {@link Transcript} have bounds
     * */
    bounds: BoundingBox | undefined;
    /**
     * The children of the element. All elements, except {@link Word} have children
     * */
    children: Array<HocrElement> | undefined;
}

export default HocrElement;