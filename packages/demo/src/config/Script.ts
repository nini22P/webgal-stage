import { SceneManager } from "../manager/SceneManager";
import { type ScriptCommand } from "../scene/ScenarioScene";
import { MainMenuScene } from "../scene/MainMenuScene";

export const script: ScriptCommand[] =
  [
    { cmd: 'bgm', src: './audio/bgm/pure_morning_0.mp3', loop: true, volume: 0.8, fade: 2 },
    { cmd: 'bg', src: './image/bg/bg.webp', fade: 1 },
    { 
      cmd: 'image', 
      id: 'character', 
      src: './image/char/char.webp', 
      transform: { y: 960, width: 700, height: 1400, opacity: 0, scaleX: 1.2, scaleY: 1.2 } 
    },
    { 
      cmd: 'image.to', 
      id: 'character', 
      transform: { opacity: 1, scaleX: 1.3, scaleY: 1.3, duration: 0.5 }, 
      wait: true 
    },
    { cmd: 'say', name: '？？', text: '你好！很高兴见到你。' },
    { cmd: 'say', name: '？？', text: '接下来将播放视频。' },
    { cmd: 'bgm', src: '', volume: 0.2, fade: 1 },
    { cmd: 'video', src: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/1080/Big_Buck_Bunny_1080_10s_5MB.webm', skip: true },
    { cmd: 'bgm', src: '', volume: 1, fade: 1 },
    { cmd: 'say', name: '？？', text: '视频播放结束。' },
    { cmd: 'say', name: '', text: '本章结束，点击返回主菜单。' },
    {
      cmd: 'exec', func: () => {
        SceneManager.instance.switch(MainMenuScene, { id: 'main' });
      }
    }
  ]
