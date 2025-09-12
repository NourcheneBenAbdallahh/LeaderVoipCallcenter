import { findUserByLogin, verifyPassword, generateToken } from "../services/authService.js";

export async function login(req, res) {
  const { login, mot_de_passe } = req.body;

  if (!login || !mot_de_passe) {
    return res.status(400).json({ message: "Login et mot de passe requis" });
  }

  try {
    const user = await findUserByLogin(login);
    if (!user) return res.status(401).json({ message: "Identifiants invalides" });

    const match = await verifyPassword(mot_de_passe, user.Mot_de_passe);
    if (!match) return res.status(401).json({ message: "Identifiants invalides" });

  //if (Number(user.Etat_Compte) !== 1) {
  //return res.status(403).json({ message: "Compte inactif" });
//}


    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.IDAgent,
        nom: user.Nom,
        prenom: user.Prenom,
        type: user.Type_Agent,
        admin: Number(user.Administrateur) === 1,
      },
    });
  } catch (err) {
    console.error(err);
res.status(500).json({ message: "Erreur serveur", error: err.message });  }
}

export async function me(req, res) {
  res.json(req.user);
}
