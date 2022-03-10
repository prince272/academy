import Image from 'next/image';
import { AspectRatio } from 'react-aspect-ratio';
import { useAppSettings } from '../utils/appSettings';
import parsePhoneNumber from 'libphonenumber-js';

const AboutPage = () => {
    const appSettings = useAppSettings();

    return (
        <>
            <div className="bg-primary">
                <div className="container py-10 d-flex justify-content-center text-center">
                    <div>
                        <h1 className="text-white">About Us</h1>
                    </div>
                </div>
            </div>
            <div className="container py-5">
                <div className="card shadow-sm border-0">
                    <div className="card-body">
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
                            <h3>People involved</h3>
                            <h5>Prince Owusu <small className="text-muted"><i>CEO &amp; Founder, Academy of Ours</i></small></h5>
                            <div className="d-flex mb-3">
                                <div className="flex-shrink-0">
                                    <Image src={'/img/prince-owusu-profile.png'} width={128} height={128} className="img-thumbnail" />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    The person who designed and built Academy of Ours. He's a programmer and web developer who enjoys a diverse array of hobbies, including building web apps, working with big data, and reverse engineering.
                                    He will be the one that answers all your questions and will assist you if you should run into any trouble.
                                </div>
                            </div>
                            <ul>
                                <li>
                                    <p>By email: <a href={`mailto:${appSettings.company.emails.support}`}>{appSettings.company.emails.support}</a></p>
                                </li>
                                <li>
                                    <p>By visiting this page on our website: <a href={appSettings.company.webLink} rel="external nofollow noopener noreferrer" target="_blank">{appSettings.company.webLink}</a></p>
                                </li>
                                <li>
                                    <p>By phone number: {((phoneNumber) => (<a href={phoneNumber.getURI()}>{phoneNumber.formatInternational()}</a>))(parsePhoneNumber(appSettings.company.phoneNumber))}</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AboutPage;