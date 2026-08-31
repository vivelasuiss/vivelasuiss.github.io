const SUPABASE_URL =
  window.SUPABASE_URL ||
  "https://ubwwdnkysazhmyqzfknh.supabase.co";

const SUPABASE_KEY =
  window.SUPABASE_KEY ||
  "sb_publishable_Qc5mc1Bmt9Zyyh1KWX75EQ_DGpr7Tso";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const commentsContainer =
  document.getElementById("commentsContainer");

const commentForm =
  document.getElementById("commentForm");

const commentStatus =
  document.getElementById("commentStatus");


/* =========================
   YORUMLARI GETİR
========================= */

async function loadComments() {

  if (!commentsContainer) return;

commentsContainer.innerHTML = `
  <div class="card review comment-loading">
    <div style="font-size:28px;margin-bottom:8px;">💬</div>
    <strong>Yorumlar hazırlanıyor…</strong>
    <p style="margin:6px 0 0;">
      Onaylanan müşteri deneyimleri burada görünecek.
    </p>
  </div>
`;

  const { data, error } =
    await supabaseClient
      .from("comments")
      .select("*")
      .eq("approved", true)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error("Yorumlar alınamadı:", error);

    commentsContainer.innerHTML =
      `<p>Yorumlar şu anda yüklenemiyor.</p>`;

    return;
  }

  if (!data || data.length === 0) {

    commentsContainer.innerHTML =
      `<p>Henüz onaylanmış yorum bulunmuyor.</p>`;

    return;
  }

  commentsContainer.innerHTML =
    data.map(comment => {

      const name =
        escapeHTML(
          comment.name || "Müşteri"
        );

      const text =
        escapeHTML(
          comment.comment ||
          comment.text ||
          ""
        );

      const rating =
        Math.max(
          1,
          Math.min(
            5,
            Number(comment.rating) || 5
          )
        );

      const stars =
        "★".repeat(rating) +
        "☆".repeat(5 - rating);

      return `
        <article class="card review">

          <div class="review-name">
            ${name}
          </div>

          <div class="stars">
            ${stars}
            <small style="color:#a4a8b5;letter-spacing:0">
              ${rating}.0
            </small>
          </div>

          <p>
            ${text}
          </p>

        </article>
      `;

    }).join("");
}


/* =========================
   YORUM GÖNDER
========================= */

if (commentForm) {

  commentForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const name =
        document
          .getElementById("commentName")
          ?.value
          .trim();

      const email =
        document
          .getElementById("commentEmail")
          ?.value
          .trim();

      const rating =
        Number(
          document
            .getElementById("commentRating")
            ?.value
        );

      const comment =
        document
          .getElementById("commentText")
          ?.value
          .trim();

      if (!name || !email || !rating || !comment) {

        commentStatus.textContent =
          "Lütfen tüm alanları doldurun.";

        return;
      }

      commentStatus.textContent =
        "Yorum gönderiliyor...";

      const { error } =
        await supabaseClient
          .from("comments")
          .insert([
            {
              name: name,
              email: email,
              rating: rating,
              comment: comment,
              approved: false
            }
          ]);

      if (error) {

        console.error(
          "Yorum gönderilemedi:",
          error
        );

        commentStatus.textContent =
          "Yorum gönderilemedi. Lütfen tekrar deneyin.";

        return;
      }

      commentForm.reset();

      commentStatus.textContent =
        "Yorumunuz gönderildi. Admin onayından sonra yayınlanacaktır.";

    }
  );

}


/* =========================
   GÜVENLİ HTML
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   BAŞLAT
========================= */

loadComments();
