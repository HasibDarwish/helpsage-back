import {ErrorRequestHandler} from "express";

const handleBadRequest: ErrorRequestHandler = (error, req, res, next) => {
	error.status === 400 ? res.status(400).send(error.message) : next(error);
};
const handleUnauthorized: ErrorRequestHandler = (error, req, res, next) => {
	error.status === 401 ? res.status(401).send(error.message) : next(error);
};

const handleForbidden: ErrorRequestHandler = (error, req, res, next) => {
	error.status === 403 ? res.status(403).send(error.message) : next(error);
};
const handleNotFound: ErrorRequestHandler = (error, req, res, next) => {
	error.status === 404 ? res.status(404).send(error.message) : next(error);
};

const handleAll: ErrorRequestHandler = (error, req, res, next) => {
	console.log(error)
	res.status(500).send("Server is on fire");
};

export default [
	handleBadRequest,
	handleUnauthorized,
	handleForbidden,
	handleNotFound,
	handleAll,
];
