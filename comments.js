const SUPABASE_URL = "https://ubwwdnkysazhmyqzfknh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Qc5mc1Bmt9Zyyh1KWX75EQ_DGpr7Tso";

const form = document.getElementById("commentForm");
const list = document.getElementById("commentsList");
const count = document.getElementById("commentCount");
const status = document.getElementById("commentStatus");

async function loadComments() {
  if (!list) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/comments?select=id,name,comment,rating,created_at&approved=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error("Yorumlar alınamadı.");

    const comments = await response.json();

    count.textContent = comments.length;

    if (!comments.length) {
      list.innerHTML = `
        <div class="comments-empty">
          Henüz onaylanmış yorum yok.<br>
          <strong>İlk yorumu sen bırakabilirsin.</strong>
        </div>
      `;
      return;
    }

    list.innerHTML = comments.map(item => {
      const rating = Math.max(1, Math.min(5, Number(item.rating) || 5));
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

      return `
        <article class="comment-item">
          <div class="comment-top">
            <span class="comment-name">${escapeHTML(item.name)}</span>
            <span class="comment-date">${formatDate(item.created_at)}</span>
          </div>
          <div class="comment-stars">${stars}</div>
          <div class="comment-body">${escapeHTML(item.comment)}</div>
        </article>
      `;
    }).join("");

  } catch (error) {
    list.innerHTML = `
      <div class="comments-empty">
        Yorumlar şu anda yüklenemiyor.
      </div>
    `;
    console.error(error);
  }
}

async function submitComment(event) {
  event.preventDefault();

  const name = document.getElementById("commentName").value.trim();
  const comment = document.getElementById("commentText").value.trim();
  const rating = Number(document.getElementById("commentRating").value);

  if (!name || !comment) return;

  status.textContent = "Yorum gönderiliyor...";

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        name,
        comment,
        rating,
        approved: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(error);
      throw new Error("Yorum gönderilemedi.");
    }

    form.reset();

    status.textContent =
      "✓ Yorumun gönderildi. Admin onayından sonra yayınlanacak.";

  } catch (error) {
    status.textContent =
      "Yorum gönderilirken bir hata oluştu.";
    console.error(error);
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

if (form) {
  form.addEventListener("submit", submitComment);
}

loadComments();
