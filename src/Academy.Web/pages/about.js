import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { AspectRatio } from 'react-aspect-ratio';
import { useAppSettings } from '../utils/appSettings';
import parsePhoneNumber from 'libphonenumber-js';

const AboutPage = () => {
    const appSettings = useAppSettings();

    return (
        <>
            <NextSeo title="About Us" />
            <div className="bg-primary">
                <div className="container py-10 d-flex justify-content-center text-center">
                    <div>
                        <h1 className="text-white">About Us</h1>
                    </div>
                </div>
            </div>
            <div className="container py-5">
                <div className="card shadow-sm border-0">
                    <div className="card-body p-lg-10">
                        <div>
                            <h3>What is Academy of Ours?</h3>
                            <p>
                                <b>Academy of Ours</b> is an e-learning platform that helps you to learn a variety of courses and concepts through interactive checkpoints, lessons, and videos with certificates awarded automatically after each course.
                            </p>
                            <h3>Benefits of an Academy of Ours</h3>
                            <ul>
                                <li>
                                    <p><b>More Comfortable Learning Environment:</b> Academy enables the teacher and the student to set their own learning pace and make schedules that fits everyone’s agenda. </p>
                                </li>
                                <li>
                                    <p><b>Can offer a wide selection of courses:</b> Easy way to add infinite skills and subjects to teach and learn.</p>
                                </li>
                                <li>
                                    <p><b>Automated Certification:</b> Studying your program online is also a great option for getting an official certificate, diploma, or degree without physically setting foot on a university campus.</p>
                                </li>
                                <li>
                                    <p><b>It's accessible on web and on the go:</b> Academy enables you to study or teach from anywhere in the world. This means there’s no need to commute from one place to another, or follow a rigid schedule.</p>
                                </li>
                                <li>
                                    <p><b>It's more cost-effective than traditional education:</b> Unlike in-person education methods, Academy tends to be more affordable. You can also save money from the commute and class materials. In other words, the monetary investment is less, but the results can be better than other options.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <section className="position-relative" style={{
                backgroundImage: "url('/img/img1.jpg')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover"
            }}>
                <div className="position-absolute top-0 left-0 bg-dark opacity-75 w-100 h-100"></div>
                <div className="position-relative">
                    <div className="container content-space-2">
                        <div className="row justify-content-center">
                            <div className="col-lg-auto">
                                <div className="border rounded bg-white d-inline-flex p-1 mb-3">
                                    <Image src={'/img/prince-owusu-profile.png'} width={128} height={128} className="img-thumbnail" />
                                </div>
                            </div>
                            <div className="col-lg-9">
                                <div className="h3 fw-bold text-white">Prince Owusu</div>
                                <div className="mb-3 text-white text-start">I'm a programmer and web developer with a wide range of interests, including web app development, data analysis, and reverse engineering. This site was built and developed so that teachers may add courses for students to study. In our world, no one is perfect, and nothing is always the best. We may, however, strive to be better. I hope that this platform will be of great help to you.</div>
                                <div className="text-white text-start">
                                    <ul>
                                        <li>
                                            <p>By email: <a className="text-white" href={`mailto:${appSettings.company.emails.support}`}>{appSettings.company.emails.support}</a></p>
                                        </li>
                                        <li>
                                            <p>By phone number: {((phoneNumber) => (<a className="text-white" href={phoneNumber.getURI()}>{phoneNumber.formatInternational()}</a>))(parsePhoneNumber(appSettings.company.phoneNumber))}</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </>
    );
};

export default AboutPage;