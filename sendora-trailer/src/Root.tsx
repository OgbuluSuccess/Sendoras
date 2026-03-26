import { Composition } from 'remotion';
import type { ComponentType } from 'react';
import { AppFrame } from './compositions/AppFrame';
import type { AppFrameProps } from './compositions/AppFrame';

const FPS             = 60;
const DESKTOP_SECONDS = 45;
const MOBILE_SECONDS  = 30;

// Cast to bypass Remotion's LooseComponentType strictness
const AppFrameComp = AppFrame as unknown as ComponentType<Record<string, unknown>>;

export const Root = () => {
  return (
    <>
      {/* 🖥  Desktop — 1920×1080 */}
      <Composition
        id="DesktopVideo"
        component={AppFrameComp}
        durationInFrames={FPS * DESKTOP_SECONDS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          mode:     'desktop',
          token:    '',
          userJson: '',
        } satisfies AppFrameProps}
      />

      {/* 📱 Mobile — 1080×1920 */}
      <Composition
        id="MobileVideo"
        component={AppFrameComp}
        durationInFrames={FPS * MOBILE_SECONDS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          mode:     'mobile',
          token:    '',
          userJson: '',
        } satisfies AppFrameProps}
      />
    </>
  );
};
