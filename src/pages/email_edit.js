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
import { confirmAlert } from 'react-confirm-alert';
import Alert from 'react-s-alert';
import 'react-confirm-alert/src/react-confirm-alert.css' 
import {DropdownButton, MenuItem} from 'react-bootstrap';
import RichTextEditor from 'react-rte';
import {fetchEmails, setEmail} from '../actions/emails.js';
import './email_edit.css';

// Page for editing email templates.
class EmailEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dropdownTitle: "Template Select",
            emailID: null,
            subject: "",
            content: RichTextEditor.createValueFromString("Email Content", 'html')
        }
    }

    // Fetch all emails.
    async componentDidMount() {
        document.title = "Email Editor";
        this.props.fetchEmails();
    }

    // Save the email being edited when the save button is pressed.
    saveEmail() {
        // TODO: the content is a controlled component; probably the
        // subject should be a controlled component too, then we can get
        // rid of this hacky use of a ref.
        const subject = this.refs.input.value;
        const content = this.state.content.toString("html");
        this.props.setEmail(this.state.emailID, subject, content).then(() => {
            Alert.info("Changes saved");
        }).catch(error => {
            confirmAlert({
                title: "Error saving email",
                message: <pre>{error.message}</pre>,
                buttons: [
                    {label: "Back", onClick: () => {}},
                ]
            });
        });
    }

    // Update the email content stored in the state when the email is
    // edited. (The email editor is a controlled component.)
    onContentChange(value) {
        if (this.state.emailID === null) {return}
        this.setState({
            content: value
        });
    }

    // Select an email template from the dropdown.
    selectFocusedEmail(email) {
        this.setState({
            dropdownTitle: email.name,
            emailID: email.id,
            content: RichTextEditor.createValueFromString(email.content, 'html')
        });
        this.refs.input.value = email.subject;
    }

    // Render the items in the dropdown list of email templates.
    renderEmailList() {
        return Object.values(this.props.emails).map(email =>
            <MenuItem eventKey={email.id} key={email.id} onSelect={() => this.selectFocusedEmail(email)}>{email.name}</MenuItem>
        );
    }

    render() {
        const text = this.props.fetching !== 0? "Fetching emails": "";
        const contentText = this.state.content;
        return (
            <div className="container">
                {text}
                <br/>
                <DropdownButton
                    title={this.state.dropdownTitle}
                    id="template-dropdown"
                >
                    {this.renderEmailList()}
                </DropdownButton>
                <input
                    placeholder="Enter Subject"
                    ref="input"
                    className="email_subject"
                    disabled={this.state.emailID === null}
                />
                <RichTextEditor
                    value={contentText}
                    onChange={(value) => this.onContentChange(value)}
                    className="email_content"
                    readOnly={false}
                />
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    onClick={() => this.saveEmail()}
                    disabled={this.state.emailID === null}
                >
                    Save
                </button>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return state.emails;
};

const mapDispatchToProps = {
    fetchEmails,
    setEmail,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EmailEditor);
