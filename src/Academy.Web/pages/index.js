import { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { BsHeartFill, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { SvgBookLoverIllus, SvgOptionsIllus, SvgTeachingIllus, SvgCertificateIllus, SvgTeacherIllus, SvgExamsIllus, SvgQuizIllus, SvgFaqIllus, SvgOnlineLearningIllus } from '../resources/images/illustrations';
import { AspectRatio } from 'react-aspect-ratio';
import { Accordion } from 'react-bootstrap';
import { ModalPathPrefix } from '../modals';
import { useAppSettings } from '../utils/appSettings';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import Mounted from '../components/Mounted';

import parsePhoneNumber from 'libphonenumber-js';

const ScrollLeftArrow = (() => {
  const {
    isFirstItemVisible,
    scrollPrev,
    visibleItemsWithoutSeparators,
    initComplete
  } = useContext(VisibilityContext);

  const [disabled, setDisabled] = useState(
    !initComplete || (initComplete && isFirstItemVisible)
  );

  useEffect(() => {
    // NOTE: detect if whole component visible
    if (visibleItemsWithoutSeparators.length) {
      setDisabled(isFirstItemVisible);
    }
  }, [isFirstItemVisible, visibleItemsWithoutSeparators]);

  return (<div className={`d-flex align-items-center p-1 mt-n1 cursor-pointer pe-auto ${disabled ? 'invisible' : ''}`} onClick={() => scrollPrev()}><span className="svg-icon svg-icon-xs"><BsChevronLeft /></span></div>);
});

const ScrollRightArrow = () => {
  const {
    isLastItemVisible,
    scrollNext,
    visibleItemsWithoutSeparators
  } = useContext(VisibilityContext);

  // console.log({ isLastItemVisible });
  const [disabled, setDisabled] = useState(
    !visibleItemsWithoutSeparators.length && isLastItemVisible
  );
  useEffect(() => {
    if (visibleItemsWithoutSeparators.length) {
      setDisabled(isLastItemVisible);
    }
  }, [isLastItemVisible, visibleItemsWithoutSeparators]);


  return (<div className={`d-flex align-items-center p-1 mt-n1 cursor-pointer pe-auto ${disabled ? 'invisible' : ''}`} onClick={() => scrollNext()}><span className="svg-icon svg-icon-xs"><BsChevronRight /></span></div>);
};

const HomePage = () => {
  const appSettings = useAppSettings();

  return (
    <>
      <NextSeo title="Home" />
      <div className="bg-white">
        <div className="container py-7">
          <div className="row align-items-center text-center">
            <div className="col-md-7 order-1 order-md-0">
              <div className="p-3">
                <h1 className="display-4 fw-bold"><span className="text-primary fw-bolder">Limitless</span> learning on the <span className="text-primary fw-bolder">GO!</span></h1>
                <p className="lead">Online courses, video lessons and personalised support for every taste.</p>
                <Link href="/courses"><a className="btn btn-primary  mb-3">Start learning</a></Link>
              </div>
            </div>
            <div className="col-md-5">
              <div className="px-10 px-md-0 py-3"><SvgBookLoverIllus /></div>
            </div>
          </div>
        </div>
      </div>

      <section id="subjects" className="bg-white">
        <div className="container py-5">
          <Mounted>
            <ScrollMenu
              LeftArrow={ScrollLeftArrow}
              RightArrow={ScrollRightArrow}

              wrapperClassName=""
              scrollContainerClassName="">
              {appSettings.course.subjects.map((subject, index) => {
                const colors = ["#d1102b", "#101620", "#135ec3", "#653c20", "#009843", "#056647", "#071f5d", "#783dbe"];

                return (
                  <Link href={{ pathname: "/courses", query: { subject: subject.value } }} key={`scroll-item-${index}`} itemId={`scroll-item-${index}`}>
                    <a className="d-flex flex-colunm justify-content-center text-center text-white rounded p-3 mx-2" style={{ backgroundColor: colors[index % colors.length] }}>
                      <div className="text-nowrap">{subject.name}</div>
                    </a>
                  </Link>
                );
              })}
            </ScrollMenu>
          </Mounted>
        </div>
      </section>
      <section id="benefits" className="bg-white">
        <div className="container content-space-3">
          <div className="text-center mx-lg-auto pb-7">
            <div><span className="badge bg-warning text-uppercase">Benefits</span></div>
            <h3 className="display-4 fw-bold">Why start <span className="text-primary">learning</span>?</h3>
            <p className="lead">We're going to go ahead and say it; learning can be fun.</p>
          </div>
          <div className="row gy-10 justify-content-center">
            <div className="col-sm-6 col-lg-4">
              <div className="text-center">
                <div className="p-3 mb-4">
                  <AspectRatio ratio="3/2">
                    <SvgOnlineLearningIllus />
                  </AspectRatio>
                </div>
                <h5 className="h3">Flexible learning</h5>
                <p className="lead mb-0">Our flexible courses mean you can study a broad range of courses without limitatins in how, what, when and where to learn.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-4">
              <div className="text-center">
                <div className="p-3 mb-4">
                  <AspectRatio ratio="3/2">
                    <SvgTeachingIllus />
                  </AspectRatio>
                </div>
                <h5 className="h3">Excellent teaching</h5>
                <p className="lead mb-0">Our students learn from award-winning lecturers and researchers who are committed to delivering the best.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-4">
              <div className="text-center">
                <div className="p-3 mb-4">
                  <AspectRatio ratio="3/2">
                    <SvgCertificateIllus />
                  </AspectRatio>
                </div>
                <h5 className="h3">Certification</h5>
                <p className="lead mb-0">Our flexible courses cover a wide range of subjects, a number of which can lead on to a recognised qualification or certificate.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="education" className="bg-light">
        <div className="container content-space-1">
          <div className="row">
            <div className="col-md-6">
              <div className="text-center mx-md-3">
                <div className="px-10 px-md-0 py-3">
                  <AspectRatio ratio="3/2">
                    <SvgTeacherIllus />
                  </AspectRatio>
                </div>
                <h5 className="h3">For Teachers</h5>
                <p className="lead">As teachers, our passion for what we do has helped many people find their own passion.</p>

                <Link href="/teach"><a className="btn btn-dark ">Become a teacher</a></Link>
              </div>
            </div>

            <div className="col-md-6">
              <div className="text-center mx-md-3">
                <div className="px-10 px-md-0 py-3">
                  <AspectRatio ratio="3/2">
                    <SvgExamsIllus />
                  </AspectRatio>
                </div>
                <h5 className="h3">For Students</h5>
                <p className="lead">As students, the most important thing to remember is that laziness is our worst enemy.</p>
                <Link href="/courses"><a className="btn btn-primary ">Start learning</a></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sponsor" className="position-relative" style={{
        backgroundImage: "url('/img/img2.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover"
      }}>
        <div className="position-absolute top-0 left-0 bg-dark opacity-75 w-100 h-100"></div>
        <div className="position-relative">
          <div className="container content-space-2">
            <div className="row justify-content-center">
              <div className="col-lg-10 text-center">
                <span className="d-block mb-4 h6 text-warning">Do you think Academy of Ours is valuable to you?</span>
                <span className="svg-icon svg-icon-lg d-block text-danger me-2 heart"><BsHeartFill /></span>
                <h2 className="mb-4 display-4 fw-bold text-white">Help keep Academy of Ours operations running, for anyone, anywhere by donating to us.</h2>
                <div>
                  <Link href={`${ModalPathPrefix}/sponsor`}>
                    <a type="button" className="btn btn-light btn-lg  px-10"><span className="svg-icon svg-icon-sm d-inline-block text-danger me-2 heart"><BsHeartFill /></span>Sponsor</a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white">
        <div className="container content-space-1">

          <div className="row justify-content-center mb-4">
            <div className="col-6">
              <SvgFaqIllus />
            </div>
          </div>
          <div className="w-lg-50 text-center mx-lg-auto mb-4">
            <h3>Frequently Asked Questions</h3>
          </div>

          <div className="w-md-75 mx-md-auto">
            <div className="card card-lg shadow-sm border-0">
              <div className="card-body p-0">
                <Accordion defaultActiveKey="0">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>1. What is Academy of Ours?</Accordion.Header>
                    <Accordion.Body>
                      Academy of Ours is an e-learning platform that helps you to learn a variety of courses and concepts through interactive checkpoints, lessons, and videos with certificates awarded automatically after each course.
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
              <div className="card-footer bg-light text-center">
                <p className="mb-0">Still have questions?</p>
                <Link href="/contact"><a className="link">Contact our friendly support team</a></Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;