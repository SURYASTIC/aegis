import { Address } from "@graphprotocol/graph-ts";
import { PostCreated, UserCreated } from "../generated/Aegis/Aegis";
import {
  AegisSupporterToken,
  Transfer,
} from "../generated/templates/AegisSupporterToken/AegisSupporterToken";

import { AegisSupporterToken as AegisSupporterTokenTemplate } from "../generated/templates";

import { AST, Post, User } from "../generated/schema";

export function handlePostCreated(event: PostCreated): void {
  // Load the post author user entity
  const author = User.load(event.params.author.toHexString());
  if (!author) {
    throw new Error("Invalid post author");
  }

  // Create a post entity
  const postId =
    event.params.author.toHexString() + "-" + event.params.timestamp.toString();
  const post = new Post(postId);
  post.isPaid = event.params.isPaid;
  post.attachments = event.params.attachments;
  post.text = event.params.text;
  post.timestamp = event.params.timestamp;
  post.author = author.id;
  post.save();
}

export function handleUserCreated(event: UserCreated): void {
  // Create a user entity
  const user = new User(event.params.publicKey.toHexString());
  user.name = event.params.name;
  user.arcanaPublicKey = event.params.arcanaPublicKey;
  user.nftAddress = event.params.nftAddress;
  user.save();

  // Start indexing the AST tokens
  AegisSupporterTokenTemplate.create(event.params.nftAddress);
}

export function handleTransfer(event: Transfer): void {
  const astId =
    event.address.toHexString() + "-" + event.params.tokenId.toString();

  if (event.params.from == Address.zero()) {
    // Get the AST contract
    const nftContract = AegisSupporterToken.bind(event.address);
    // Load the user entity associated with the AST
    const user = User.load(nftContract.user().toHexString());
    if (!user) {
      throw new Error("Invalid AST user");
    }

    // Create an AST entity
    const ast = new AST(astId);
    ast.tokenId = event.params.tokenId;
    ast.mintedTo = event.params.to.toHexString();
    ast.holder = event.params.to.toHexString();
    ast.user = user.id;
    ast.save();
  } else {
    // Load the AST entity and update
    const ast = AST.load(astId);
    if (!ast) {
      throw new Error("AST entity not found");
    }
    ast.holder = event.params.to.toHexString();
    ast.save();
  }
}
