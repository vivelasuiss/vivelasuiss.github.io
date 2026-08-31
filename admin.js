const SUPABASE_URL = "https://ubwwdnkysazhmyqzfknh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Qc5mc1Bmt9Zyyh1KWX75EQ_DGpr7Tso";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const ADMIN_EMAIL = "vivelasuiss@outlook.com";

const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");

const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");

const logoutButton = document.getElementById("logoutButton");

const commentsContainer =
  document.getElementById("commentsContainer");

const pendingCount =
  document.getElementById("pendingCount");

const approvedCount =
  document.getElementById("approvedCount");

const adminStatus =
  document.getElementById("adminStatus");


async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    showLogin();
    return;
  }

  const user = data.session?.user;

  if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    showAdmin();
    loadComments();
  } else {
    showLogin();
  }
}


loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  loginStatus.textContent = "Giriş yapılıyor...";

  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    loginStatus.textContent =
      "Bu hesap admin paneline erişemez.";
    return;
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error(error);
    loginStatus.textContent =
      "E-posta veya parola hatalı.";
    return;
  }

  if (
    !data.user ||
    data.user.email?.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
  ) {
    await supabaseClient.auth.signOut();

    loginStatus.textContent =
      "Bu hesap admin paneline erişemez.";

    return;
  }

  loginForm.reset();
  loginStatus.textContent = "";

  showAdmin();
  loadComments();
});


logoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});


async function loadComments() {

  adminStatus.textContent = "Yorumlar yükleniyor...";

  const { data, error } = await supabaseClient
    .from("comments")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(error);

    adminStatus.textContent =
      "Yorumlar yüklenirken hata oluştu.";

    return;
  }

  const pending =
    data.filter(comment => comment.approved === false);

  const approved =
    data.filter(comment => comment.approved === true);

  pendingCount.textContent = pending.length;
  approvedCount.textContent = approved.length;

  adminStatus.textContent = "";

  renderComments(data);
}


function renderComments(comments) {

  if (!comments.length) {
    commentsContainer.innerHTML = `
      <div class="empty">
        Henüz yorum bulunmuyor.
      </div>
    `;

    return;
  }

  commentsContainer.innerHTML =
    comments.map(comment => {

      const rating =
        Math.max(
          1,
          Math.min(5, Number(comment.rating) || 5)
        );

      const stars =
        "★".repeat(rating) +
        "☆".repeat(5 - rating);

      const status =
        comment.approved
          ? "ONAYLANDI"
          : "BEKLİYOR";

      return `
        <article
          class="admin-comment"
          data-id="${comment.id}"
        >

          <div class="admin-comment-header">

            <div>
              <div class="admin-comment-name">
                ${escapeHTML(comment.name)}
              </div>
              
              <div class="admin-comment-email">
             ✉ ${escapeHTML(comment.email || "E-posta belirtilmemiş")}
              </div>

              <div class="admin-stars">
                ${stars}
              </div>
            </div>

            <div class="admin-comment-date">
              ${formatDate(comment.created_at)}
              <br>
              ${status}
            </div>

          </div>

          <div class="admin-comment-text">
            ${escapeHTML(comment.comment)}
          </div>

          <div class="admin-actions">

            ${
              !comment.approved
                ? `
                  <button
                    class="action-button approve-button"
                    onclick="approveComment('${comment.id}')"
                  >
                    ✓ Onayla
                  </button>
                `
                : `
                  <button
                    class="action-button delete-button"
                    onclick="unapproveComment('${comment.id}')"
                  >
                    Gizle
                  </button>
                `
            }

            <button
              class="action-button delete-button"
              onclick="deleteComment('${comment.id}')"
            >
              🗑 Sil
            </button>

          </div>

        </article>
      `;

    }).join("");
}


async function approveComment(id) {

  const { error } = await supabaseClient
    .from("comments")
    .update({
      approved: true
    })
    .eq("id", id);

  if (error) {
    console.error(error);

    alert("Yorum onaylanamadı.");
    return;
  }

  await loadComments();
}


async function unapproveComment(id) {

  const { error } = await supabaseClient
    .from("comments")
    .update({
      approved: false
    })
    .eq("id", id);

  if (error) {
    console.error(error);

    alert("Yorum gizlenemedi.");
    return;
  }

  await loadComments();
}


async function deleteComment(id) {

  const confirmed =
    confirm(
      "Bu yorumu kalıcı olarak silmek istediğine emin misin?"
    );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("comments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);

    alert("Yorum silinemedi.");
    return;
  }

  await loadComments();
}


function showAdmin() {
  loginPanel.hidden = true;
  adminPanel.hidden = false;
}


function showLogin() {
  adminPanel.hidden = true;
  loginPanel.hidden = false;
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

  return new Date(date).toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


checkSession();
