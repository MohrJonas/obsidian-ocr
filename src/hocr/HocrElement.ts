import BoundingBox from "./BoundingBox";

interface HocrElement {
    bounds: BoundingBox | undefined;
    children: Array<HocrElement> | undefined;
}

export default HocrElement;