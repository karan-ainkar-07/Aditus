import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { cookies } from "../modules/auth/auth.config.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET.length < 32) {
  throw new Error("ACCESS_TOKEN_SECRET must be configured securely");
}

export default async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[cookies.accessName];

    if (!token) {
      return res.status(401).json({
        message: "Access token required.",
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET, {
        algorithms: ["HS256"],
      });
    } catch {
      return res.status(401).json({
        message: "Invalid or expired access token.",
      });
    }

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({
        message: "Invalid access token payload.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({
        message: "Account is not available.",
      });
    }

    req.user = { id: user.id };

    next();
  } catch {
    return res.status(500).json({
      message: "Authentication could not be completed.",
    });
  }
}