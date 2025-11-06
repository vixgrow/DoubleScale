import tinycolor from 'tinycolor2';

export function StageTextColor(stageColor: string): string {
  const tc = tinycolor(stageColor).setAlpha(1); 
  if (tc.isLight()) {
    
    return tc.darken(40).toHexString(); 
  } else {
    
    return tc.lighten(40).toHexString();
  }
}