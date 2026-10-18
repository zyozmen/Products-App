function Reviews({ t }) {
    return (
        <section>
            <h2 className="hu-mb-5 hu-mt-0 hu-text-xl hu-font-bold">{t('review_sample_heading')}</h2>
            <article className="hu-flex hu-gap-4">
                <img
                    src="/img/user.jpg"
                    alt=""
                    className="hu-h-12 hu-w-12 hu-shrink-0 hu-rounded-full hu-object-cover"
                />
                <div className="hu-min-w-0">
                    <h3 className="hu-m-0 hu-font-semibold">
                        John Doe
                        <small className="hu-ml-2 hu-font-normal hu-text-slate-500">- <i>01 Jan 2045</i></small>
                    </h3>
                    <div className="hu-mb-2 hu-mt-1 hu-text-amber-500" aria-label="4.5 stars">★★★★☆</div>
                    <p className="hu-m-0 hu-text-sm hu-leading-6 hu-text-slate-700">{t('review_sample_text')}</p>
                </div>
            </article>
        </section>
    );
}

export default Reviews;
