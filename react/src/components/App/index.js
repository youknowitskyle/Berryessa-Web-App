import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";

import Navigation from "../Navigation";
import LandingPage from "../Landing";
import SignUpPage from "../SignUp";
import SignInPage from "../SignIn";
import PasswordForgetPage from "../PasswordForget";
import HomePage from "../Home";
import AccountPage from "../Account";
import AdminPage from "../Admin";
import PermissionDenied from "../Denied";
import PrayerPage from "../Prayer";
import ModeratorPage from "../Moderator";
import CalendarPage from "../Calendar";

import { AuthUserContext } from "../Session";

import * as ROUTES from "../../constants/routes";
import { withAuthentication } from "../Session";

const App = () => (
  <Router>
    <div>
      <Navigation />

      <hr />

      <Route exact path={ROUTES.LANDING} component={LandingPage} />
      <Route path={ROUTES.SIGN_UP} component={SignUpPage} />
      <Route path={ROUTES.SIGN_IN} component={SignInPage} />
      <Route path={ROUTES.PASSWORD_FORGET} component={PasswordForgetPage} />
      <Route path={ROUTES.HOME} component={HomePage} />
      <Route path={ROUTES.ACCOUNT} component={AccountPage} />
      <Route path={ROUTES.ADMIN} component={AdminPage} />
      <Route path={ROUTES.MODERATOR} component={ModeratorPage} />
      <Route path={ROUTES.DENIED} component={PermissionDenied} />
      <Route path={ROUTES.PRAYER} component={PrayerPage} />
      <Route path={ROUTES.CALENDAR} component={CalendarPage} />
    </div>
  </Router>
);
export default withAuthentication(App);
