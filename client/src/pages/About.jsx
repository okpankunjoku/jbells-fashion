import "../App.css";
import { Link } from "react-router-dom";

function About() {
    const values = [
        {
            number: "01",
            title: "Personal style",
            text: "We believe clothing is a way to express who you are. Our collection is selected to help you build a style that feels natural and confident."
        },
        {
            number: "02",
            title: "Everyday comfort",
            text: "Style should feel as good as it looks. We focus on clothing that fits into everyday life while helping you look put together."
        },
        {
            number: "03",
            title: "Confidence",
            text: "The right outfit can change how you feel. JBELLS is here to help you show up with confidence, wherever the day takes you."
        }
    ];

    return (
        <div className="jb-about-page">
            <style>{`
                .jb-about-page {
                    background: #faf9f6;
                    color: #22221f;
                    min-height: 100vh;
                }

                .jb-about-page .about-hero {
                    min-height: 430px;
                    padding: clamp(70px, 11vw, 145px) clamp(22px, 8vw, 110px);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    background: #22221f;
                    color: #faf9f6;
                    position: relative;
                    overflow: hidden;
                }

                .jb-about-page .about-hero::after {
                    content: "JBELLS";
                    position: absolute;
                    right: -2vw;
                    bottom: -5vw;
                    color: rgba(255,255,255,.045);
                    font-family: Georgia, serif;
                    font-size: clamp(110px, 24vw, 330px);
                    line-height: 1;
                    pointer-events: none;
                }

                .jb-about-page .about-eyebrow {
                    display: block;
                    font-size: 11px;
                    letter-spacing: .22em;
                    text-transform: uppercase;
                    margin-bottom: 22px;
                    color: #b9a98c;
                }

                .jb-about-page .about-hero h1 {
                    position: relative;
                    z-index: 1;
                    max-width: 850px;
                    margin: 0;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: clamp(48px, 8vw, 100px);
                    font-weight: 400;
                    line-height: 1.04;
                }

                .jb-about-page .about-hero h1 em,
                .jb-about-page .about-intro h2 em {
                    color: #c5b69b;
                    font-weight: 400;
                }

                .jb-about-page .about-hero p {
                    position: relative;
                    z-index: 1;
                    max-width: 570px;
                    margin: 26px 0 0;
                    color: #dedbd3;
                    font-size: 15px;
                    line-height: 1.9;
                }

                .jb-about-page .about-content {
                    width: min(1180px, calc(100% - 44px));
                    margin: 0 auto;
                }

                .jb-about-page .about-intro {
                    display: grid;
                    grid-template-columns: 1fr 1.1fr;
                    gap: clamp(35px, 8vw, 110px);
                    padding: clamp(75px, 10vw, 130px) 0;
                    align-items: start;
                }

                .jb-about-page .about-intro h2,
                .jb-about-page .values-heading h2,
                .jb-about-page .about-cta h2 {
                    margin: 12px 0 0;
                    font-family: "Playfair Display", Georgia, serif;
                    font-weight: 400;
                    font-size: clamp(36px, 5vw, 62px);
                    line-height: 1.13;
                }

                .jb-about-page .about-intro-copy {
                    color: #68675f;
                    font-size: 15px;
                    line-height: 2;
                }

                .jb-about-page .about-intro-copy p {
                    margin: 0 0 18px;
                }

                .jb-about-page .about-statement {
                    background: #eeece6;
                    padding: clamp(55px, 8vw, 100px) 24px;
                    text-align: center;
                }

                .jb-about-page .about-statement blockquote {
                    max-width: 850px;
                    margin: 18px auto 0;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: clamp(27px, 4.4vw, 49px);
                    line-height: 1.35;
                    font-weight: 400;
                }

                .jb-about-page .values-section {
                    padding: clamp(75px, 10vw, 125px) 0;
                }

                .jb-about-page .values-heading {
                    max-width: 650px;
                    margin-bottom: 48px;
                }

                .jb-about-page .values-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    border-top: 1px solid #dcd9d1;
                }

                .jb-about-page .value-card {
                    padding: 28px 28px 15px 0;
                    border-right: 1px solid #dcd9d1;
                }

                .jb-about-page .value-card + .value-card {
                    padding-left: 28px;
                }

                .jb-about-page .value-card:last-child {
                    border-right: 0;
                }

                .jb-about-page .value-number {
                    color: #a18f70;
                    font-size: 11px;
                    letter-spacing: .15em;
                }

                .jb-about-page .value-card h3 {
                    margin: 30px 0 14px;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: 27px;
                    font-weight: 400;
                }

                .jb-about-page .value-card p {
                    color: #77766f;
                    font-size: 14px;
                    line-height: 1.9;
                }

                .jb-about-page .about-cta {
                    background: #eeece6;
                    color: #22221f;
                    padding: clamp(38px, 5vw, 58px) 24px;
                    text-align: center;
                }

                .jb-about-page .about-cta p {
                    max-width: 520px;
                    margin: 14px auto 22px;
                    color: #68675f;
                    font-size: 14px;
                    line-height: 1.8;
                }

                .jb-about-page .about-cta .about-shop-link {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 44px;
                    padding: 0 24px;
                    background: #22221f;
                    color: #faf9f6;
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: .12em;
                    transition: background .2s ease;
                }

                .jb-about-page .about-cta .about-shop-link:hover {
                    background: #514a3d;
                }

                .jb-about-page .about-footer {
                    padding: 38px clamp(22px, 8vw, 110px) 22px;
                    background: #f1efe9;
                }

                .jb-about-page .about-footer-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 25px;
                    padding-bottom: 28px;
                }

                .jb-about-page .about-footer-main img {
                    width: 115px;
                    height: auto;
                    object-fit: contain;
                }

                .jb-about-page .about-footer-main p {
                    margin: 0;
                    color: #77766f;
                    font-size: 13px;
                    line-height: 1.8;
                    text-align: right;
                }

                .jb-about-page .about-footer-bottom {
                    border-top: 1px solid #dedbd3;
                    padding-top: 18px;
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    color: #77766f;
                    font-size: 11px;
                }

                .jb-about-page .about-footer-bottom a {
                    color: inherit;
                    text-decoration: none;
                    letter-spacing: .08em;
                }

                @media (max-width: 700px) {
                    .jb-about-page .about-hero {
                        min-height: 390px;
                    }

                    .jb-about-page .about-intro {
                        grid-template-columns: 1fr;
                        gap: 25px;
                    }

                    .jb-about-page .values-grid {
                        grid-template-columns: 1fr;
                    }

                    .jb-about-page .value-card,
                    .jb-about-page .value-card + .value-card {
                        padding: 25px 0;
                        border-right: 0;
                        border-bottom: 1px solid #dcd9d1;
                    }

                    .jb-about-page .value-card:last-child {
                        border-bottom: 0;
                    }

                    .jb-about-page .value-card h3 {
                        margin-top: 17px;
                    }

                    .jb-about-page .about-footer-main {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .jb-about-page .about-footer-main p {
                        text-align: left;
                    }

                    .jb-about-page .about-footer-bottom {
                        flex-direction: column;
                    }
                }
            `}</style>
                <section className="about-hero">
                    <span className="about-eyebrow">GET TO KNOW JBELLS</span>
                    <h1>
                        More than fashion.
                        <br />
                        <em>A way to be you.</em>
                    </h1>
                    <p>
                        We believe personal style should feel comfortable,
                        expressive, and confidently yours. Welcome to JBELLS.
                    </p>
                </section>

                <div className="about-content">
                    <section className="about-intro">
                        <div>
                            <span className="about-eyebrow">OUR STORY</span>
                            <h2>
                                Style that feels
                                <br />
                                <em>like you.</em>
                            </h2>
                        </div>

                        <div className="about-intro-copy">
                            <p>
                                JBELLS is a fashion brand dedicated to male and
                                unisex clothing. Our collection brings together
                                contemporary style, everyday comfort, and
                                versatile pieces for different moments in life.
                            </p>
                            <p>
                                We believe what you wear should express your
                                personality. Whether you are putting together
                                an everyday look or choosing something for a
                                special moment, our aim is to help you feel
                                comfortable and confident in your style.
                            </p>
                            <p>
                                Thank you for being part of the JBELLS journey.
                                We look forward to helping you discover pieces
                                that feel right for you.
                            </p>
                        </div>
                    </section>
                </div>

                <section className="about-statement">
                    <span className="about-eyebrow">THE JBELLS APPROACH</span>
                    <blockquote>
                        “Wear what expresses you. Feel comfortable in your
                        style. Step out with confidence.”
                    </blockquote>
                </section>

                <section className="about-content values-section">
                    <div className="values-heading">
                        <span className="about-eyebrow">WHAT MATTERS TO US</span>
                        <h2>Our values, in every detail.</h2>
                    </div>

                    <div className="values-grid">
                        {values.map((value) => (
                            <article className="value-card" key={value.number}>
                                <span className="value-number">
                                    {value.number}
                                </span>
                                <h3>{value.title}</h3>
                                <p>{value.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="about-cta">
                    <span className="about-eyebrow">FIND YOUR NEXT LOOK</span>
                    <h2>Make the style yours.</h2>
                    <p>
                        Explore the JBELLS collection and discover clothing
                        selected for style, comfort, and confidence.
                    </p>
                    <Link to="/shop" className="about-shop-link">
                        EXPLORE THE COLLECTION
                    </Link>
                </section>
        </div>
    );
}

export default About;
