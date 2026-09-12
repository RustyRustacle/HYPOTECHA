import {Composition} from "remotion";
import {HypothecaScene} from "./video/HypothecaTitle";

export const HYPOTECHAComposition: React.FC = () => {
	return (
		<Composition
			id="HYPOTECHA"
			component={HypothecaScene}
			durationInFrames={900}
			fps={30}
			width={1920}
			height={1080}
		/>
	);
};