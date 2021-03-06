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
import { connect } from 'react-redux';
import Alert from 'react-s-alert';
import {fetchLatestSeries, saveRotation, sendReminder} from '../actions/rotations';
import {getSupervisorProjects, getCogsProjects, getStudentProjects} from '../actions/users';
import GroupEditor from '../components/group_editor';
import ProjectList from '../components/project_list.js';

import './main_page.css';

// The homepage.
//
// This renders quite different content depending on the roles the
// current user has. Members of the Graduate Office see an editor with
// the details of the rotations in this series; supervisors see a list
// of the projects they have created; students see a list of projects
// they have been assigned; and CoGS members see a list of projects they
// are marking. If a user has multiple roles, they will see multiple
// sections.
class MainPage extends Component {
    async componentDidMount() {
        document.title = "Dashboard";
        this.props.fetchLatestSeries();
        this.props.getSupervisorProjects(this.props.user);
        this.props.getCogsProjects(this.props.user);
        this.props.getStudentProjects(this.props.user);
    }

    // Render all rotations in the current series (visible to members of
    // the Graduate Office).
    renderRotations() {
        // Sort descending by part.
        return Object.values(this.props.rotations).sort((a, b) => b.data.part - a.data.part).map(rotation =>
            <GroupEditor
                key = {rotation.data.part}
                group = {rotation}
                onSave = {(rotation) => {
                    this.props.saveRotation(rotation, ()=> {
                        Alert.info("Rotation saved");
                    });
                }}
                sendReminder = {() => {
                    this.props.sendReminder(rotation);
                }}
            />
        );
    }

    // Render projects where the current user's ID matches some property
    // of the project (specified by `lambda`).
    renderProjects(header, lambda, displaySupervisorName) {
        const allProjects = this.props.projects;
        const projects = Object.keys(allProjects).reduce((filtered, id) => {
            if (lambda(allProjects[id].data) === this.props.user.data.id) {
                filtered[id] = allProjects[id];
            }
            return filtered;
        }, {});
        return ( 
            <div>
                <h4>{header}</h4>
                <ProjectList 
                    projects={projects}
                    showVote={false}
                    displaySupervisorName={displaySupervisorName}
                />
            </div>
        );
    }

    // The list of projects owned by the current user.
    renderSupervisorProjects() {
        return this.renderProjects("Projects I own", (project => project.supervisor_id), false);
    }

    // The list of projects the current user is the CoGS member for.
    renderCogsProjects() {
        return this.renderProjects("Projects I'm a CoGS marker for", (project => project.cogs_marker_id), false);
    }

    // The list of projects the current user is assigned to complete.
    renderStudentProjects() {
        return this.renderProjects("My Projects", (project => project.student_id), true);
    }

    // The separator between sections, shown if a user has multiple
    // roles.
    renderSeparator() {
        return <hr className="main-sep"/>
    }

    render() {
        const perms = this.props.user.data.permissions
        return (
            <div className="container">
                <h4>Welcome, {this.props.user.data.name}</h4>
                <div className="clearfix"></div>
                {perms.create_project_groups && this.renderRotations()}
                {perms.join_projects && this.renderStudentProjects()}
                {perms.join_projects && perms.create_projects && this.renderSeparator()}
                {perms.create_projects && this.renderSupervisorProjects()}
                {perms.create_projects && perms.review_other_projects && this.renderSeparator()}
                {perms.review_other_projects && this.renderCogsProjects()}
            </div>
        );
    }
}

const mapStateToProps = state => {
    const allRotations = state.rotations.rotations;
    const latestSeries = allRotations[state.rotations.latestID].data.series;
    const rotations = Object.keys(allRotations).reduce((filtered, id) => {
        if (allRotations[id].data.series === latestSeries) {
            filtered[id] = allRotations[id];
        }
        return filtered;
    }, {});

    return {
        user: state.users.users[state.users.loggedInID],
        projects: state.projects.projects,
        rotations
    }
};  

const mapDispatchToProps = dispatch => {
    return {
        saveRotation: (rotation, onDone) => dispatch(saveRotation(rotation, onDone)),
        sendReminder: rotation => dispatch(sendReminder(rotation)),
        fetchLatestSeries: () => dispatch(fetchLatestSeries()),
        getSupervisorProjects: (user) => dispatch(getSupervisorProjects(user)),
        getCogsProjects: (user) => dispatch(getCogsProjects(user)),
        getStudentProjects: (user) => dispatch(getStudentProjects(user))
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MainPage);
