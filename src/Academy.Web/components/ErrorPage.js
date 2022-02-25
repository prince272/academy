import { useRouter } from "next/router";
import { useEffect } from "react";
import { BsArrowRepeat, BsHouse } from "react-icons/bs";
import { SvgAppWordmark } from "../resources/images/icons";
import { SvgPageNotFoundIllus, SvgServerDownIllus } from "../resources/images/illustrations";

const ErrorPage = ({ error }) => {
    const router = useRouter();

    useEffect(() => {
        console.error(error.message, error.status, error);
    }, []);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center h-100">
            <header className="navbar navbar-height navbar-light navbar-absolute-top mt-2">
                <div className="container">
                    <a className="navbar-brand mx-auto" href="/">
                        <div className="svg-icon"><SvgAppWordmark style={{ width: "auto", height: "2.5rem" }} /></div>
                    </a>
                </div>
            </header>
            <div>
                <div className="d-flex flex-column text-center justify-content-center">
                    <div className="mb-4">
                        {error.status == '404' ?
                            (<SvgPageNotFoundIllus style={{ width: "auto", height: "184px" }} />) :
                            (<SvgServerDownIllus style={{ width: "auto", height: "184px" }} />)}

                    </div>
                    {error.message && <div className="mb-3">{error.message} status: {error.status}</div>}
                    <div className="hstack gap-3 mx-auto">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                            window.location.href = "/";
                        }}>
                            <span className="svg-icon svg-icon-xs d-inline-block me-1"><BsHouse /></span><span>Home</span>
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => {
                            window.location.reload();
                        }}>
                            <span className="svg-icon svg-icon-xs d-inline-block me-1"><BsArrowRepeat /></span><span>Reload</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="position-absolute bottom-0 start-0 end-0">
                <footer className="container py-4">
                    <div className="row align-items-md-center text-center">
                        <div className="col-md mb-3 mb-md-0">
                            <p className="mb-0">Copyright © {new Date().getFullYear()} Academy of ours. All rights reserved</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ErrorPage;