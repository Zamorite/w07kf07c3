import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import * as firebase from "firebase/app";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";

import { User } from "../models/user";
import { Credentials } from "../models/credentials";

@Injectable()
export class AuthService {
  user$: Observable<User>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    // *Get auth data, then get firestore user document || null
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })

      // Add these lines to set/read the user data to local storage
      // tap(user => localStorage.setItem('user', JSON.stringify(user))),
      // startWith(JSON.parse(localStorage.getItem('user'))),
    );
  }

  // ***Login/Signup
  // **Email/Password

  emailSignUp(credentials: Credentials) {
    // return this.af.auth.createUser(credentials)
    return this.afAuth.auth
      .createUserWithEmailAndPassword(credentials.email, credentials.password)
      .then(credential => {
        console.log("success");

        this.updateUserData(credential.user);
      })
      .catch(error => console.log(error));
  }

  emailLogin(credentials: Credentials) {
    //  return this.af.auth.login(credentials,
    return this.afAuth.auth
      .signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(credential => {
        console.log("success");

        this.updateUserData(credential.user);
      })
      .catch(error => console.log(error));
  }

  // **OAuth

  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }

  private oAuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider).then(credential => {
      this.updateUserData(credential.user);
    });
  }

  signOut() {
    this.afAuth.auth.signOut();
  }

  private updateUserData(user) {
    // *Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );
    const data: User = {
      uid: user.uid,
      email: user.email,
      roles: {
        employee: true
      }
    };
    return userRef.set(data, { merge: true });
  }

  // ***Role-based Authorization

  canRead(user: User): boolean {
    const allowed = ["admin", "editor", "subscriber"];
    return this.checkAuthorization(user, allowed);
  }

  canEdit(user: User): boolean {
    const allowed = ["admin", "editor"];
    return this.checkAuthorization(user, allowed);
  }

  canDelete(user: User): boolean {
    const allowed = ["admin"];
    return this.checkAuthorization(user, allowed);
  }

  // *determines if user has matching role
  private checkAuthorization(user: User, allowedRoles: string[]): boolean {
    if (!user) return false;
    for (const role of allowedRoles) {
      if (user.roles[role]) {
        return true;
      }
    }
    return false;
  }
}
