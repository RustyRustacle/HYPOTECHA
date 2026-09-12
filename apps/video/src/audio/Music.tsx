import {Audio, staticFile} from "remotion";

export const MUSIC_FILE = "music/bgmusic.mp3";
export const MUSIC_VOLUME = 0.18;

export const Music: React.FC = () => {
	return <Audio src={staticFile(MUSIC_FILE)} volume={MUSIC_VOLUME} />;
};