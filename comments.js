/* VIVELASUISS - Supabase customer comments */

(() => {

  const SUPABASE_URL =
    window.SUPABASE_URL ||
    "https://ubwwdnkysazhmyqzfknh.supabase.co";

  const SUPABASE_KEY =
    window.SUPABASE_KEY ||
    "sb_publishable_Qc5mc1Bmt9Zyyh1KWX75EQ_DGpr7Tso";


  const container =
    document.getElementById("commentsContainer");

  const form =
    document.getElementById("commentForm");

  const status =
    document.getElementById("commentStatus");


  if (!container) {
    console.error("commentsContainer bulunamadı.");
    return;
  }


  if (!window.supabase) {
    console.error("Supabase JS yüklenmemiş.");

    container.innerHTML = `
      <div class="card review comment-loading">
        <strong>Yorumlar şu anda yüklenemiyor.</strong>
        <p>Lütfen daha sonra tekrar deneyin.</p>
      </div>
    `;

    return;
  }


  const db =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );


  /* =========================
     HTML GÜVENLİĞİ
  ========================= */

  function escapeHTML(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =========================
     YORUMLARI GÖSTER
  ========================= */

  function renderComments(data) {

    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="card review comment-loading">

          <div style="font-size:28px;margin-bottom:8px;">
            💬
          </div>

          <strong>
            Henüz yayınlanmış yorum yok.
          </strong>

          <p>
            İlk deneyimini sen paylaş!
          </p>

        </div>
      `;

      return;
    }


    container.innerHTML = data.map(comment => {

      const name =
        escapeHTML(
          comment.name || "Müşteri"
        );


      const text =
        escapeHTML(
          comment.comment || ""
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


      let date = "";

      if (comment.created_at) {

        date =
          new Intl.DateTimeFormat(
            "tr-TR",
            {
              dateStyle: "medium"
            }
          ).format(
            new Date(comment.created_at)
          );

      }


      return `
        <article class="card review">

          <div class="review-name">
            ${name}
          </div>

          <div
            class="stars"
            aria-label="${rating} / 5"
          >
            ${stars}
          </div>

          <p>
            ${text}
          </p>

          ${
            date
              ? `<small style="color:#8f93a3;">${date}</small>`
              : ""
          }

        </article>
      `;

    }).join("");

  }


  /* =========================
     SUPABASE'DEN YORUMLARI AL
  ========================= */

  async function loadComments() {

    container.innerHTML = `
      <div class="card review comment-loading">

        <div style="font-size:28px;margin-bottom:8px;">
          💬
        </div>

        <strong>
          Yorumlar hazırlanıyor…
        </strong>

        <p>
          Onaylanan müşteri deneyimleri burada görünecek.
        </p>

      </div>
    `;


    const {
      data,
      error
    } = await db
      .from("comments")
      .select(
        "id,name,rating,comment,approved,created_at"
      )
      .eq(
        "approved",
        true
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(50);


    if (error) {

      console.error(
        "Yorumlar alınamadı:",
        error
      );


      container.innerHTML = `
        <div class="card review comment-loading">

          <strong>
            Yorumlar şu anda yüklenemiyor.
          </strong>

          <p>
            Lütfen daha sonra tekrar deneyin.
          </p>

        </div>
      `;

      return;
    }


    renderComments(data || []);

  }


  /* =========================
     YORUM GÖNDER
  ========================= */

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        const name =
          document
            .getElementById("commentName")
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

        
        const email =
          document
            .getElementById("commentEmail")
            ?.value
            .trim();


        /* E-posta inputu index'te olabilir,
           fakat Supabase tablosunda email kolonu
           olmadığı için veritabanına göndermiyoruz. */


        if (
          !name ||
          !email ||
          !rating ||
          !comment
        ) {

          if (status) {

            status.textContent =
              "Lütfen adınızı, puanınızı ve yorumunuzu doldurun.";

          }

          return;

        }


        if (name.length < 2 || name.length > 40) {

          if (status) {

            status.textContent =
              "İsim 2-40 karakter arasında olmalıdır.";

          }

          return;

        }


        if (comment.length < 5 || comment.length > 500) {

          if (status) {

            status.textContent =
              "Yorum 5-500 karakter arasında olmalıdır.";

          }

          return;

        }


        if (status) {

          status.textContent =
            "Yorum gönderiliyor…";

        }


        const button =
          form.querySelector(
            "button[type='submit']"
          );


        if (button) {

          button.disabled = true;

        }


       

        const {
          error
        } = await db
          .from("comments")
          .insert({

            name: name,

            email: email,

            rating: rating,

            comment: comment

          });


        if (error) {

          console.error(
            "Yorum gönderme hatası:",
            error
          );


          if (status) {

            status.textContent =
              "Yorum gönderilemedi. Lütfen tekrar deneyin.";

          }


          if (button) {

            button.disabled = false;

          }

          return;

        }


        form.reset();


        if (status) {

          status.textContent =
            "Yorumun gönderildi. Admin onayından sonra yayınlanacak.";

        }


        if (button) {

          button.disabled = false;

        }

      }
    );

  }


  /* =========================
     BAŞLAT
  ========================= */

  loadComments();

})();
