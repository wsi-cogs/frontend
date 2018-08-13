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


import axios from 'axios';
import api_url from '../config.js';


export const FETCH_PROJECTS = 'FETCH_PROJECTS';
export const REQUEST_PROJECTS = 'REQUEST_PROJECTS';
export const RECEIVE_PROJECT = 'RECEIVE_PROJECT';

function requestProjects(noProjects) {
    return {
        type: REQUEST_PROJECTS,
        noProjects
    }
}

function receiveProject(project) {
    return {
        type: RECEIVE_PROJECT,
        project
    }
}

export default function fetchProjects(series, part) {
    return function (dispatch) {
        axios.get(`${api_url}/api/series/${series}/${part}`).then(response => {
            const projects = response.data.links.projects;
            dispatch(requestProjects(projects.length));
            projects.forEach(link => {
                axios.get(`${api_url}${link}`).then(response => {
                    dispatch(receiveProject(response.data));
                });
            })
        });
    }
}