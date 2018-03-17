import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

import { ItemTypesOverviewComponent } from './item-types/item-types-overview.component';
import { ItemTypeDetailComponent } from './item-types/item-type-detail.component';

import { LoginGuard } from './shared/rest/guards/login.guard';
import { ModGuard } from './shared/rest/guards/mod.guard';
import { AdminGuard } from './shared/rest/guards/admin.guard';

const routes: Routes = [
  { path: 'item-types', component: ItemTypesOverviewComponent, canActivate: [ModGuard] },
  { path: 'item-types/:id', component: ItemTypeDetailComponent, canActivate: [ModGuard] },
  { path: '', pathMatch: 'full', component: HomeComponent, canActivate: [LoginGuard] },
  { path: 'login', pathMatch: 'full', component: LoginComponent},
  { path: '**', redirectTo: '' }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {useHash: true})
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
