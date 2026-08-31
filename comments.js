/* VIVELASUISS - Supabase customer comments */

(() => {

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_KEY;

  const container =
    document.getElementById("commentsContainer");

  const form =
    document.getElementById("commentForm");

  const status =
    document.getElementById("commentStatus");


  /* =========================
     KONTROLLER
  ========================= */

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

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase URL veya Publishable Key bulunamadı.");
    container.innerHTML = `
      <div class="card review comment-loading">
        <strong>Yorumlar şu anda yüklenemiyor.</strong>
        <p>Lütfen daha sonra tekrar deneyin.</p>
      </div>
    `;
    return;
  }


  /* =========================
     SUPABASE
  ========================= */

  const supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );


  /* =========================
     GÜVENLİ HTML
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
     YORUMLARI EKRANA BAS
  ========================= */

  function renderComments(comments) {

    if (!comments || comments.length === 0) {

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


    container.innerHTML =
      comments.map(item => {

        const name =
          escapeHTML(
            item.name || "Müşteri"
          );


        const text =
          escapeHTML(
            item.comment ??
            item.text ??
            ""
          );


        let rating =
          Number(item.rating) || 5;


        rating =
          Math.max(
            1,
            Math.min(5, rating)
          );


        const stars =
          "★".repeat(rating) +
          "☆".repeat(5 - rating);


        return `

          <article class="card review">

            <div
              class="stars"
              aria-label="${rating} yıldız"
            >
              ${stars}

              <small
                style="
                  color:#a4a8b5;
                  letter-spacing:0;
                "
              >
                ${rating}.0
              </small>

            </div>


            <div class="review-name">
              ${name}
            </div>


            <p>
              ${text}
            </p>

          </article>

        `;

      }).join("");

  }


  /* =========================
     YORUMLARI SUPABASE'DEN AL
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
    } =
      await supabaseClient

        .from("comments")

        .select(
          "id,name,comment,rating,approved,created_at"
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
        );


    if (error) {

      console.error(
        "Supabase yorum hatası:",
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


    renderComments(
      data || []
    );

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


        if (
          !name ||
          !email ||
          !rating ||
          !comment
        ) {

          if (status) {

            status.textContent =
              "Lütfen tüm alanları doldurun.";

          }

          return;

        }


        if (status) {

          status.textContent =
            "Yorum gönderiliyor…";

        }


        const {
          error
        } =
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
            "Yorum gönderme hatası:",
            error
          );


          if (status) {

            status.textContent =
              "Yorum gönderilemedi. Lütfen tekrar deneyin.";

          }

          return;

        }


        form.reset();


        if (status) {

          status.textContent =
            "Yorumunuz gönderildi. Admin onayından sonra yayınlanacaktır.";

        }

      }
    );

  }


  /* =========================
     BAŞLAT
  ========================= */

  loadComments();

})();
