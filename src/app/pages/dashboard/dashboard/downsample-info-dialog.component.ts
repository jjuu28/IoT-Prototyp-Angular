import { Component, HostListener } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-downsample-info-dialog',
  template: `
    <div class="ds-info-dialog">
      <h2>Warum Downsampling?</h2>

      <p>
        Durch Downsampling werden z.B. nur <strong>{{ max }}</strong> repräsentative
        Messpunkte dargestellt. So laden die Diagramme schneller, ohne dass
        Trends verloren gehen.
      </p>

      <ul>
        <li>⚡ Schnelleres Rendering</li>
        <li>📉 Klarere Trendlinien</li>
        <li>📡 Weniger Datenvolumen</li>
      </ul>

      <p style="margin-top:16px;">
        Deaktiviere Downsampling, wenn du jede einzelne Messung sehen
        möchtest – dein Browser muss das dann aber stemmen! 😉
      </p>

      <button mat-flat-button
              class="close-btn"
              mat-dialog-close>
        Verstanden
      </button>

    </div>
  `,
  styles: [`
    .ds-info-dialog{
      background:linear-gradient(135deg,#03a9f4 0%,#9c27b0 100%);
      color:#fff;
      padding:24px 28px;
      border-radius:16px;
      box-shadow:0 12px 32px rgba(0,0,0,.45);
      transform-style:preserve-3d;
      animation:zoomIn .35s ease-out;
    }
    h2{margin:0 0 12px;}
    ul{padding-left:20px;margin:8px 0;}
    li{margin:4px 0;}
    button{margin-top:24px;}


    .close-btn{
      margin-top:24px;
      padding:10px 20px;
      border-radius:32px;
      font-weight:600;
      letter-spacing:.3px;
      color:#fff;
      background:rgba(255,255,255,.18);
      border:1px solid rgba(255,255,255,.35);
      backdrop-filter:blur(8px);
      box-shadow:0 4px 14px rgba(0,0,0,.25);
      transition:all .25s ease;
    }
    .close-btn:hover{
      background:rgba(255,255,255,.28);
      transform:translateY(-2px);
      box-shadow:0 6px 18px rgba(0,0,0,.35);
    }
    .close-btn:active{
      transform:scale(.96);
      box-shadow:0 3px 10px rgba(0,0,0,.3);
    }

    @keyframes zoomIn{
      from{transform:scale(.7) rotateX(-12deg);}
      to{transform:scale(1)  rotateX(0);}
    }
  `],
  imports:[CommonModule,MatDialogModule]
})
export class DownsampleInfoDialogComponent{
  max:number = +(localStorage.getItem('dsPoints') ?? 50);

  /* kleiner Tilt-Effekt */
  @HostListener('mousemove',['$event'])
  tilt(e:MouseEvent){
    const card = e.currentTarget as HTMLElement;
    const halfH = card.clientHeight/2, halfW = card.clientWidth/2;
    const rotX  = (e.offsetY-halfH)/25;
    const rotY  = (e.offsetX-halfW)/-25;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }
  @HostListener('mouseleave')
  reset(){ (event?.currentTarget as HTMLElement).style.transform='rotateX(0) rotateY(0)'; }
}
