/*
Copyright (c) 2018 Genome Research Ltd.

Authors:
* Simon Beal <sb48@sanger.ac.uk>

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at
your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import React, {Component} from 'react';

import {
    BrowserRouter as Router,
    Route,
    Switch,
  } from 'react-router-dom';
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom';
import rootReducer from './reducers/root.js';
import MainPage from './pages/main_page.js';
import DefaultPage from './pages/default_page.js';
import {fetchMe} from './actions/users'
import Header from './header.js';
import { connect } from 'react-redux';

import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/stackslide.css';

import './index.css';
import {fetchLatestSeries} from './actions/rotations.js';
import Projects from './pages/projects.js';
import MarkableProjects from './pages/markable_projects.js'
import EmailEditor from './pages/email_edit.js';
import UserEditor from './pages/user_edit.js';
import RotationCreate from './pages/rotation_create.js';
import ProjectCreate from './pages/project_create.js';
import ProjectResubmit from './pages/project_resubmit.js';
import ProjectEdit from './pages/project_edit.js';
import RotationCogsEditor from './pages/rotation_cogs_edit.js';
import RotationChoiceEditor from './pages/rotation_choices_finalise.js'
import ProjectUpload from './pages/project_upload'
import {ProjectMarkSupervisor, ProjectMarkCogs} from './pages/project_mark'
import ProjectDownload from './pages/project_download'
import {ProjectFeedbackSupervisor, ProjectFeedbackCogs} from './pages/project_feedback';

import catchErrors from './interceptors/errors';
import cacheRequests from './interceptors/cache';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({trace: true}) : compose;
const store = createStore(
    rootReducer,
    composeEnhancers(applyMiddleware(
      thunkMiddleware, // lets us dispatch() functions
    ))
  )

// The root component.
class App extends Component {
    // Install the Axios interceptors, and fetch the ID of the logged-in
    // user and all rotations from the latest series.
    async componentDidMount() {
        catchErrors();
        cacheRequests();
        this.props.fetchMe();
        this.props.fetchLatestSeries();
    }
    // Fetch the ID of the logged-in user and all rotations from the
    // latest series, if they haven't yet been fetched.
    async componentDidUpdate() {
        if (!this.props.loggedInID) {
            this.props.fetchMe();
        }
        if (!this.props.latestRotationID) {
            this.props.fetchLatestSeries();
        }
    }

    render() {
        if (!this.props.latestRotationID || !this.props.loggedInID) {
            if (this.props.user && !this.props.user.data.permissions.view_projects_predeadline) {
                return (
                    <Router>
                        <div>
                            <Header/>
                            <div className="container">
                                <p>
                                    The PhD Student Portal is currently not available for student access.
                                </p>
                            </div>
                            <Alert stack={{limit: 3}} effect="stackslide"/>
                        </div>
                    </Router>
                );
            }
            return (
                <Alert stack={{limit: 3}} effect="stackslide"/>
            );
        }
        return (
            <Router>
                <div>
                    <Header/>
                    <Switch>
                        <Route exact path="/" component={MainPage}/>
                        <Route exact path="/projects" component={Projects}/>
                        <Route exact path="/projects/markable" component={MarkableProjects}/>
                        <Route exact path="/emails/edit" component={EmailEditor}/>
                        <Route exact path="/people/edit" component={UserEditor}/>
                        <Route exact path="/rotations/create" component={RotationCreate}/>
                        <Route exact path="/projects/create" component={ProjectCreate}/>
                        <Route exact path="/projects/:projectID/upload" component={ProjectUpload}/>
                        <Route exact path="/projects/:projectID/resubmit" component={ProjectResubmit}/>
                        <Route exact path="/projects/:projectID/edit" component={ProjectEdit}/>
                        <Route exact path="/projects/:projectID/download" component={ProjectDownload}/>
                        <Route exact path="/projects/:projectID/provide_feedback/supervisor" component={ProjectMarkSupervisor}/>
                        <Route exact path="/projects/:projectID/provide_feedback/cogs" component={ProjectMarkCogs}/>
                        <Route exact path="/projects/:projectID/supervisor_feedback" component={ProjectFeedbackSupervisor}/>
                        <Route exact path="/projects/:projectID/cogs_feedback" component={ProjectFeedbackCogs}/>
                        <Route exact path="/rotations/:series/:part/choices" component={RotationChoiceEditor}/>
                        <Route exact path="/rotations/:series/:part/cogs" component={RotationCogsEditor}/>
                        <Route component={DefaultPage} />
                    </Switch>
                    <Alert stack={{limit: 3}} effect="stackslide"/>
                </div>
            </Router>
        );
    }
}

const mapStateToProps = state => {
    return {
        loggedInID: state.users.loggedInID,
        user: state.users.users[state.users.loggedInID],
        latestRotationID: state.rotations.latestID,
    }
};  

const mapDispatchToProps = dispatch => {
    return {
        fetchMe: () => dispatch(fetchMe()),
        fetchLatestSeries: () => dispatch(fetchLatestSeries()),
    }
};

const ConnectedApp = connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

ReactDOM.render(<Provider store={store}><ConnectedApp /></Provider>, document.getElementById('root'));
