import ErrorView from "../components/ErrorView";

const ErrorPage = ({ statusCode }) => {
    return (<ErrorView error={{ status: statusCode || 404 }} />)
};

ErrorPage.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err.statusCode;
    return { statusCode }
};

export default ErrorPage;