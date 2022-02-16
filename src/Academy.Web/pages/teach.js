import Link from 'next/link';
import { SvgTeachingIllus, SvgInspirationIllus, SvgSuperThankYouIllus, SvgCareerProgressIllus, SvgSaveToBookmarksIllus, SvgTeacherIllus, SvgWalletIllus } from '../resources/images/illustrations';
import { BsArrowRight } from 'react-icons/bs';
import { AspectRatio } from 'react-aspect-ratio';
import { ModalPathPrefix } from '../modals';

const TeachingPage = () => {

    return (
        <>
            <section className="bg-white">
                <div className="container content-space-1">
                    <div className="row align-items-center text-center">
                        <div className="col-md-5">
                            <div className="px-5 px-md-0 py-3"><SvgTeachingIllus /></div>
                        </div>
                        <div className="col-md-7 order-1 order-md-0">
                            <div className="p-3">
                                <h1 className="display-4 fw-bold">Become a <span className="text-primary fw-bolder">Teacher</span></h1>
                                <p className="lead">Becoming a teacher lets you take part in shaping the next generation.</p>
                                <Link href={{ pathname: `${ModalPathPrefix}/contact`, query: { subject: "applyAsTeacher" } }}><a className="btn btn-primary  mb-3">Apply as teacher</a></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="insights" className="bg-light">
                <div className="container content-space-3">
                    <div className="text-center mx-lg-auto pb-7">
                        <div><span className="badge bg-warning text-uppercase">Insights</span></div>
                        <h3 className="display-4 fw-bold">How it works in <span className="text-primary">teaching</span>?</h3>
                        <p className="lead">You can be your guiding star with our help</p>
                    </div>
                    <div className="row gy-10 justify-content-center">
                        <div className="col-sm-6 col-lg-4">
                            <div className="text-center">
                                <div className="p-3 mb-4 position-relative">
                                    <AspectRatio ratio="3/2">
                                        <SvgTeacherIllus />
                                    </AspectRatio>
                                    <div className="position-absolute top-0 start-50 translate-middle bg-primary text-white shadow-sm rounded-pill fs-3 d-flex justify-content-center align-items-center mt-n3" style={{ width: "42px", height: "42px" }}>1</div>
                                </div>
                                <h5 className="h3">Become a Teacher</h5>
                                <p className="lead mb-0">Each day that you work with students, you have the potential to make a lasting impression.</p>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-4">
                            <div className="text-center">
                                <div className="p-3 mb-4 position-relative">
                                    <AspectRatio ratio="3/2">
                                        <SvgSaveToBookmarksIllus />
                                    </AspectRatio>
                                    <div className="position-absolute top-0 start-50 translate-middle bg-primary text-white shadow-sm rounded-pill fs-3 d-flex justify-content-center align-items-center mt-n3" style={{ width: "42px", height: "42px" }}>2</div>
                                </div>
                                <h5 className="h3">Add your Courses</h5>
                                <p className="lead mb-0">Create your meaningful contents, and structure it in a thoughtful manner to look great.</p>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-4">
                            <div className="text-center">
                                <div className="p-3 mb-4 position-relative">
                                    <AspectRatio ratio="3/2">
                                        <SvgWalletIllus />
                                    </AspectRatio>
                                    <div className="position-absolute top-0 start-50 translate-middle bg-primary text-white shadow-sm rounded-pill fs-3 d-flex justify-content-center align-items-center mt-n3" style={{ width: "42px", height: "42px" }}>3</div>
                                </div>
                                <h5 className="h3">Start Earning Money</h5>
                                <p className="lead mb-0">Earn from students purchases. The best way to make money and turn your time teaching into profit.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="benefits" className="bg-white">
                <div className="container content-space-3">
                    <div className="text-center mx-lg-auto pb-7">
                        <div><span className="badge bg-warning text-uppercase">Benefits</span></div>
                        <h3 className="display-4 fw-bold">Why start <span className="text-primary">teaching</span>?</h3>
                        <p className="lead">We're going to go ahead and say it; teaching can be fun.</p>
                    </div>
                    <div className="row gy-10 justify-content-center">
                        <div className="col-sm-6 col-lg-4">
                            <div className="text-center">
                                <div className="p-3 mb-4">
                                    <AspectRatio ratio="3/2">
                                        <SvgInspirationIllus />
                                    </AspectRatio>
                                </div>
                                <h5 className="h3">Make a Difference</h5>
                                <p className="lead mb-0">Each day that you work with students, you have the potential to make a lasting impression.</p>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-4">
                            <div className="text-center">
                                <div className="p-3 mb-4">
                                    <AspectRatio ratio="3/2">
                                        <SvgCareerProgressIllus />
                                    </AspectRatio>
                                </div>
                                <h5 className="h3">Clear Career Path</h5>
                                <p className="lead mb-0">If you have a desire to progress in your career, teaching has a very clear path to do so.</p>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-4">
                            <div className="text-center">
                                <div className="p-3 mb-4">
                                    <AspectRatio ratio="3/2">
                                        <SvgSuperThankYouIllus />
                                    </AspectRatio>
                                </div>
                                <h5 className="h3">Share Your Love</h5>
                                <p className="lead mb-0">Getting students excited about topics you love is just one way you can share a love of learning.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default TeachingPage;