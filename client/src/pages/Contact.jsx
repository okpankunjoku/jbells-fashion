import { useState } from "react";
import {
    Mail,
    Phone,
    MapPin,
    Send,
} from "lucide-react";

import "../App.css";

function Contact() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const subject = encodeURIComponent(
            form.subject.trim() || "Message from JBELLS website"
        );

        const body = encodeURIComponent(
            `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
        );

        // This opens the visitor's email application; it does not send
        // or store the message through the website.
        window.location.href =
            `mailto:Jbellscreations@gmail.com?subject=${subject}&body=${body}`;
    }

    const socialLinks = [
        {
            name: "Instagram",
            handle: "Jbellscreation",
            href: "https://www.instagram.com/Jbellscreation/",
        },
        {
            name: "Snapchat",
            handle: "jbells001",
            href: "https://www.snapchat.com/add/jbells001",
        },
        {
            name: "Facebook",
            handle: "Jbellscreations",
            href: "https://www.facebook.com/Jbellscreations",
        },
        {
            name: "TikTok",
            handle: "@jbells",
            href: "https://www.tiktok.com/@jbells",
        },
    ];

    return (
        <div className="jb-contact-page">
            <style>{`
                .jb-contact-page {
                    min-height: 100vh;
                    background: #faf9f6;
                    color: #22221f;
                }

                .jb-contact-page .contact-hero {
                    padding: clamp(65px, 10vw, 120px) 22px;
                    text-align: center;
                    background: #22221f;
                    color: #faf9f6;
                }

                .jb-contact-page .contact-eyebrow {
                    display: block;
                    margin-bottom: 18px;
                    color: #b9a98c;
                    font-size: 11px;
                    letter-spacing: .22em;
                    text-transform: uppercase;
                }

                .jb-contact-page .contact-hero h1 {
                    margin: 0;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: clamp(48px, 8vw, 88px);
                    font-weight: 400;
                    line-height: 1.08;
                }

                .jb-contact-page .contact-hero h1 em {
                    color: #c5b69b;
                    font-weight: 400;
                }

                .jb-contact-page .contact-hero p {
                    max-width: 570px;
                    margin: 22px auto 0;
                    color: #dedbd3;
                    font-size: 14px;
                    line-height: 1.9;
                }

                .jb-contact-page .contact-layout {
                    width: min(1160px, calc(100% - 44px));
                    margin: 0 auto;
                    padding: clamp(65px, 9vw, 110px) 0;
                    display: grid;
                    grid-template-columns: .9fr 1.1fr;
                    gap: clamp(35px, 8vw, 100px);
                    align-items: start;
                }

                .jb-contact-page .contact-info h2,
                .jb-contact-page .contact-form-wrap h2 {
                    margin: 10px 0 18px;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: clamp(34px, 4.5vw, 52px);
                    font-weight: 400;
                    line-height: 1.15;
                }

                .jb-contact-page .contact-intro {
                    margin: 0 0 34px;
                    color: #77766f;
                    font-size: 14px;
                    line-height: 1.9;
                }

                .jb-contact-page .contact-detail {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 19px 0;
                    border-top: 1px solid #e2dfd7;
                }

                .jb-contact-page .contact-icon {
                    display: flex;
                    flex: 0 0 42px;
                    width: 42px;
                    height: 42px;
                    align-items: center;
                    justify-content: center;
                    background: #eeece6;
                    color: #75664d;
                }

                .jb-contact-page .contact-detail h3 {
                    margin: 0 0 6px;
                    font-size: 12px;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                }

                .jb-contact-page .contact-detail p,
                .jb-contact-page .contact-detail a {
                    margin: 0;
                    color: #77766f;
                    font-size: 14px;
                    line-height: 1.8;
                    overflow-wrap: anywhere;
                }

                .jb-contact-page .contact-detail a {
                    text-decoration: none;
                }

                .jb-contact-page .contact-detail a:hover,
                .jb-contact-page .social-link:hover {
                    color: #9b8056;
                }

                .jb-contact-page .social-section {
                    margin-top: 32px;
                }

                .jb-contact-page .social-section h3 {
                    margin: 0 0 15px;
                    font-size: 12px;
                    letter-spacing: .1em;
                    text-transform: uppercase;
                }

                .jb-contact-page .social-list {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px 18px;
                }

                .jb-contact-page .social-link {
                    color: #77766f;
                    font-size: 13px;
                    text-decoration: none;
                    transition: color .2s ease;
                }

                .jb-contact-page .contact-form-wrap {
                    padding: clamp(25px, 4vw, 44px);
                    background: #eeece6;
                }

                .jb-contact-page .contact-form-wrap > p {
                    margin: 0 0 27px;
                    color: #77766f;
                    font-size: 14px;
                    line-height: 1.8;
                }

                .jb-contact-page .contact-form {
                    display: grid;
                    gap: 18px;
                }

                .jb-contact-page .form-field label {
                    display: block;
                    margin-bottom: 8px;
                    color: #44433e;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                }

                .jb-contact-page .form-field input,
                .jb-contact-page .form-field textarea {
                    display: block;
                    width: 100%;
                    min-height: 48px;
                    padding: 13px 14px;
                    border: 1px solid #d8d4ca;
                    border-radius: 0;
                    outline: none;
                    background: #faf9f6;
                    color: #22221f;
                    font: inherit;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .jb-contact-page .form-field textarea {
                    min-height: 145px;
                    resize: vertical;
                }

                .jb-contact-page .form-field input:focus,
                .jb-contact-page .form-field textarea:focus {
                    border-color: #9b8056;
                }

                .jb-contact-page .contact-submit {
                    display: inline-flex;
                    min-height: 49px;
                    padding: 0 22px;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    border: 0;
                    background: #22221f;
                    color: #fff;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: .12em;
                    transition: background .2s ease;
                }

                .jb-contact-page .contact-submit:hover {
                    background: #514a3d;
                }

                .jb-contact-page .form-note {
                    margin: 0;
                    color: #77766f;
                    font-size: 12px;
                    line-height: 1.7;
                }

                .jb-contact-page .contact-bottom {
                    padding: clamp(32px, 4vw, 48px) 22px;
                    background: #eeece6;
                    color: #22221f;
                    text-align: center;
                }

                .jb-contact-page .contact-bottom h2 {
                    margin: 0 0 12px;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: clamp(30px, 4vw, 43px);
                    font-weight: 400;
                }

                .jb-contact-page .contact-bottom p {
                    margin: 0;
                    color: #68675f;
                    font-size: 14px;
                    line-height: 1.8;
                }

                .jb-contact-page .contact-footer {
                    padding: 35px clamp(22px, 8vw, 110px) 22px;
                    background: #f1efe9;
                }

                .jb-contact-page .contact-footer-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 25px;
                    padding-bottom: 25px;
                }

                .jb-contact-page .contact-footer-main img {
                    width: 115px;
                    height: auto;
                    object-fit: contain;
                }

                .jb-contact-page .contact-footer-main p {
                    margin: 0;
                    color: #77766f;
                    font-size: 13px;
                    line-height: 1.8;
                    text-align: right;
                }

                .jb-contact-page .contact-footer-bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    padding-top: 18px;
                    border-top: 1px solid #dedbd3;
                    color: #77766f;
                    font-size: 11px;
                }

                .jb-contact-page .contact-footer-bottom a {
                    color: inherit;
                    text-decoration: none;
                    letter-spacing: .08em;
                }

                @media (max-width: 760px) {
                    .jb-contact-page .contact-layout {
                        grid-template-columns: 1fr;
                    }

                    .jb-contact-page .contact-footer-main {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .jb-contact-page .contact-footer-main p {
                        text-align: left;
                    }

                    .jb-contact-page .contact-footer-bottom {
                        flex-direction: column;
                    }
                }
            `}</style>
                <section className="contact-hero">
                    <span className="contact-eyebrow">WE WOULD LOVE TO HEAR FROM YOU</span>
                    <h1>
                        Let's talk
                        <br />
                        <em>style.</em>
                    </h1>
                    <p>
                        Have a question about our collection or need help with
                        something? Get in touch with the JBELLS team.
                    </p>
                </section>

                <section className="contact-layout">
                    <div className="contact-info">
                        <span className="contact-eyebrow">CONTACT DETAILS</span>
                        <h2>We're here to help.</h2>
                        <p className="contact-intro">
                            Reach out through any of the channels below. We look
                            forward to hearing from you.
                        </p>

                        <div className="contact-detail">
                            <span className="contact-icon">
                                <MapPin size={19} />
                            </span>
                            <div>
                                <h3>Visit us</h3>
                                <p>
                                    No. 1 Gaeron Crescent, Dawaki News Engineering,
                                    FCT Abuja, Nigeria
                                </p>
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=No.1+Gaeron+Crescent+Dawaki+News+Engineering+Abuja+Nigeria"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View on map
                                </a>
                            </div>
                        </div>

                        <div className="contact-detail">
                            <span className="contact-icon">
                                <Mail size={19} />
                            </span>
                            <div>
                                <h3>Email us</h3>
                                <a href="mailto:Jbellscreations@gmail.com">
                                    Jbellscreations@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="contact-detail">
                            <span className="contact-icon">
                                <Phone size={19} />
                            </span>
                            <div>
                                <h3>Call us</h3>
                                <a href="tel:+2348105056702">
                                    08105056702
                                </a>
                            </div>
                        </div>

                        <div className="social-section">
                            <h3>Connect with JBELLS</h3>
                            <div className="social-list">
                                {socialLinks.map((social) => (
                                    <a
                                        className="social-link"
                                        href={social.href}
                                        key={social.name}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {social.name}: {social.handle} ↗
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-wrap">
                        <span className="contact-eyebrow">SEND A MESSAGE</span>
                        <h2>How can we help?</h2>
                        <p>
                            Complete the form below. Your email application will
                            open with your message ready to send to JBELLS.
                        </p>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label htmlFor="contact-name">Your name</label>
                                <input
                                    id="contact-name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="contact-email">Email address</label>
                                <input
                                    id="contact-email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="contact-subject">Subject</label>
                                <input
                                    id="contact-subject"
                                    name="subject"
                                    type="text"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="What is your message about?"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="contact-message">Message</label>
                                <textarea
                                    id="contact-message"
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Write your message here..."
                                    required
                                />
                            </div>

                            <button type="submit" className="contact-submit">
                                <Send size={16} />
                                PREPARE EMAIL
                            </button>

                            <p className="form-note">
                                This form opens your device's default email
                                application. It does not submit or store messages
                                directly on the website.
                            </p>
                        </form>
                    </div>
                </section>

                <section className="contact-bottom">
                    <h2>Thank you for choosing JBELLS.</h2>
                    <p>
                        Style. Comfort. Confidence.
                        <br />
                        We look forward to connecting with you.
                    </p>
                </section>
        </div>
    );
}

export default Contact;
