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
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {fetchRotationYears, excelExport} from './actions/rotations'

// The header at the top of every page.
//
// Props: none
class Header extends Component {
    // Fetch the list of years which contain a rotation, to populate the
    // dropdown for the "Export to Excel" button.
    async componentDidMount() {
        if (this.props.user.permissions.view_all_submitted_projects && !this.props.rotationYears.length) {
            this.props.fetchRotationYears();
        }
    }

    // Which link should get the "active" styling?
    getActiveKey() {
        return this.props.location.pathname;
    }

    // Conditionally render a styled link to a path.
    renderLink(link, name, do_render, key=undefined) {
        if (!do_render) return;
        return (
            <NavItem eventKey={link} key={key}>{name}</NavItem>
        );
    }

    // Render the left-hand side of the header, containing links to
    // lists of projects and to the homepage.
    renderLeftNav() {
        const user = this.props.user;
        const rotation = this.props.rotation;
        if (user === null || rotation === null) {
            return (
                <Nav activeKey={this.getActiveKey()}>
                    {this.renderLink("/", "Home", true)}
                </Nav>
            );
        }
        const permissions = user.permissions;
        return (
            <Nav activeKey={this.getActiveKey()}>
                {this.renderLink("/", "Home", true)}
                {this.renderLink("/projects/create", "Create Project", (permissions.create_projects || permissions.modify_permissions) && !rotation.read_only)}
                {this.renderLink("/projects", "All Projects", permissions.view_projects_predeadline || rotation.student_viewable)}
                {this.renderLink("/projects/markable", "Markable Projects", permissions.create_projects || permissions.review_other_projects)}
                {/* TODO: there used to be an "Upload final project" link here,
                but it no longer worked, because a student's latest project
                isn't necessarily the project that they expect to upload to. It
                would be nice if this button could be resurrected -- e.g. by
                looking for the student's (only) uploadable project.
                */}
            </Nav>
        );
    }

    // Render the contents of the "Edit CoGS Markers" dropdown.
    renderCogsEdit(series, maxPart) {
        return [...Array(maxPart).keys()].map(i => {
            return this.renderLink(`/rotations/${series}/${i+1}/cogs`, `Rotation ${i+1}`, true, i);
        });
    }

    // Render the contents of the "Export to Excel" dropdown.
    renderExcelExport() {
        return this.props.rotationYears.map(year => {
            return <MenuItem 
                onSelect={() => {
                    this.props.excelExport(year);
                }} 
                key={year}
            >
                {year}
            </MenuItem>;
        });
    }

    // Render the right-hand side of the header, containing links to
    // things other than lists of projects.
    renderRightNav() {
        const user = this.props.user;
        const rotation = this.props.rotation;
        if (user === null || rotation === null) {
            return (
                <Nav pullRight={true} activeKey={this.getActiveKey()}>
                    {this.renderLink("/login", "Login", !user)}
                    {this.renderLink("/logout", "Logout", user)}
                </Nav>
            );
        }
        const permissions = user.permissions;
        return (
            <Nav pullRight={true} activeKey={this.getActiveKey()}>
                {this.renderLink(`/rotations/${rotation.series}/${rotation.part}/choices`, "View Student Choices", permissions.set_readonly && rotation.student_choosable && !rotation.can_finalise)}
                {this.renderLink(`/rotations/${rotation.series}/${rotation.part}/choices`, "Finalise Student Choices", permissions.set_readonly && rotation.can_finalise)}
                {this.renderLink("/rotations/create", "Create Rotation", permissions.create_project_groups && rotation.read_only && !rotation.can_finalise)}

                {permissions.view_all_submitted_projects && 
                    <NavDropdown title="Edit CoGS Markers" id="navbar_cogs_marker_dropdown" eventKey="cogs_dropdown">
                        {this.renderCogsEdit(rotation.series, rotation.part)}
                    </NavDropdown>
                }
                {permissions.view_all_submitted_projects && 
                    <NavDropdown title="Export to Excel" id="navbar_excel_dropdown" eventKey="excel_dropdown">
                        {this.renderExcelExport()}
                    </NavDropdown>
                }
                {this.renderLink("/emails/edit", "Edit Email Templates", permissions.modify_permissions)}
                {this.renderLink("/people/edit", "Edit Users", permissions.modify_permissions)}
                {this.renderLink("/login", "Login", !user)}
                {this.renderLink("/logout", "Logout", user)}
            </Nav>
        );
    }

    render() {
        return (
            <Navbar staticTop={true} fluid={true} collapseOnSelect={true} onSelect={(eventKey, event) => {
                if (["/login", "/logout"].includes(eventKey)) {
                    window.location = eventKey;
                }
                else {
                    this.props.history.push(eventKey);
                }
            }}>
                <Navbar.Header>
                    <Navbar.Brand>
                        PhD Student Portal
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                </Navbar.Header>
                <Navbar.Collapse>
                    {this.renderLeftNav()}
                    {this.renderRightNav()}
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.users.users[state.users.loggedInID] !== undefined ? state.users.users[state.users.loggedInID].data : null,
        rotation: state.rotations.rotations[state.rotations.latestID] !== undefined ? state.rotations.rotations[state.rotations.latestID].data : null,
        rotationYears: state.rotations.yearList,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchRotationYears: () => dispatch(fetchRotationYears()),
        excelExport: (url) => dispatch(excelExport(url))
    }
};

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(Header));
