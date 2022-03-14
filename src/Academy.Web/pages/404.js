import ErrorPage from "./_error"

const NotFoundPage = () => {
    return <ErrorPage error={{ status: 404, message: "The page you're looking for does not exist." }} />;
};

export default NotFoundPage;