import { Address } from "@graphprotocol/graph-ts";
import {
  Aegis,
  PostCreated,
  UserCreated,
  UserFollowed,
} from "../generated/Aegis/Aegis";
import {
  AegisSupporterToken,
  Transfer,
} from "../generated/templates/AegisSupporterToken/AegisSupporterToken";

import { AegisSupporterToken as AegisSupporterTokenTemplate } from "../generated/templates";

import { Follow, Post, User } from "../generated/schema";

export function handlePostCreated(event: PostCreated): void {
  // Load the post author user entity
  const user = User.load(event.params.user.toHexString());
  if (!user) {
    throw new Error("Invalid post author");
  }

  // Create a post entity
  const postId =
    event.params.user.toHexString() + "-" + event.params.postIndex.toString();
  const post = new Post(postId);
  post.isPaid = event.params.isPaid;
  post.attachments = event.params.attachments;
  post.text = event.params.text;
  post.timestamp = event.params.timestamp;
  post.author = user.id;
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

export function handleUserFollowed(event: UserFollowed): void {
  // Create a follow entity
  const followId =
    event.params.follower.toHexString() +
    "-" +
    event.params.followed.toHexString();
  const follow = new Follow(followId);
  follow.follower = event.params.follower.toHexString();
  follow.followed = event.params.followed.toHexString();
  follow.save();
}

export function handleTransfer(event: Transfer): void {
  if (event.params.from === Address.zero()) {
    // Get the AST contract
    const nftContract = AegisSupporterToken.bind(event.address);
    // Load the user entity associated with the AST
    const user = User.load(nftContract.user().toHexString());
    if (!user) {
      throw new Error("Invalid AST user");
    }
    // Increase the nftsMinted counter of that user
    user.nftsMinted = user.nftsMinted + 1;
  }
}
