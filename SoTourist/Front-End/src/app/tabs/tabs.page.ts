import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  public selectedTab: string = 'home';

  constructor(private router: Router) {
    addIcons({ triangle, ellipse, square });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const path = this.router.url.split('/')[2]; // /tabs/home → "home"
        this.selectedTab = path;
      }
    });
  }
}
