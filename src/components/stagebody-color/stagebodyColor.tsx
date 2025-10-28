import tinycolor from 'tinycolor2';

interface StageColorInfo {
  baseColor: string;
  backgroundColor: string;
}

export function StageColorBody(
  stageColor: string,
  index: number,
  totalStages: number
): StageColorInfo {
  const baseColor = tinycolor(stageColor).toString();
  const backgroundColor = tinycolor(stageColor).lighten(30).toString();

  return { baseColor, backgroundColor};
}
