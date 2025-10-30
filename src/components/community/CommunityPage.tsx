import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Send, Image, Video, FileText, Trash2, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/auth";
import { db } from "@/lib/firebase";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  content: string;
  mediaType?: "image" | "video" | "article";
  mediaUrl?: string;
  likes: string[]; // userIds
  comments: { id: string; userId: string; userName: string; isAuthor: boolean; text: string; createdAt?: any }[];
  createdAt?: Timestamp;
};

export function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"image" | "video" | "article" | undefined>(undefined);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

  async function uploadToCloudinary(file: File, type: "image" | "video") {
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured");
    const resource = type === "video" ? "video" : "image";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url as string;
  }

  // Subscribe to latest single post
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(1));
    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        // Seed a single dummy post once if none exists
        if (user) {
          await addDoc(collection(db, "posts"), {
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatar ?? null,
            authorRole: user.role,
            content: "Welcome to Echo Alum Link! This is your first post.",
            mediaType: null,
            mediaUrl: null,
            likes: [],
            comments: [],
            createdAt: serverTimestamp(),
          });
        }
        setPosts([]);
        return;
      }
      const items: Post[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setPosts(items);
    });
    return () => unsub();
  }, [user]);

  const userLiked = useMemo(() => {
    if (!user) return (postId: string) => false;
    return (postId: string) => posts.find((p) => p.id === postId)?.likes.includes(user.id) ?? false;
  }, [posts, user]);

  const handlePickMedia = (type: "image" | "video" | "article") => {
    setUploadType(type);
    if (type === "article") return; // handled as text/link in content for now
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setUploadFile(f);
    if (f) {
      const isVideo = f.type.startsWith("video/");
      const isImage = f.type.startsWith("image/");
      setUploadType(isVideo ? "video" : isImage ? "image" : undefined);
    }
  };

  const handleCreatePost = async () => {
    if (!user) return;
    if (!newPost.trim() && !uploadFile) return;

    let mediaUrl: string | undefined;
    if (uploadFile && uploadType && uploadType !== "article") {
      mediaUrl = await uploadToCloudinary(uploadFile, uploadType);
    }

    await addDoc(collection(db, "posts"), {
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar ?? null,
      authorRole: user.role,
      content: newPost.trim(),
      mediaType: uploadType ?? null,
      mediaUrl: mediaUrl ?? null,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
    });

    setNewPost("");
    setUploadFile(null);
    setUploadType(undefined);
  };

  const handleLike = async (post: Post) => {
    if (!user) return;
    const refDoc = doc(db, "posts", post.id);
    const already = post.likes.includes(user.id);
    await updateDoc(refDoc, {
      likes: already ? arrayRemove(user.id) : arrayUnion(user.id),
    });
  };

  const handleAddComment = async (post: Post) => {
    if (!user) return;
    const text = (commentInputs[post.id] || "").trim();
    if (!text) return;
    const refDoc = doc(db, "posts", post.id);
    const comment = {
      id: `${user.id}_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      isAuthor: user.id === post.authorId,
      text,
      createdAt: Date.now(),
    };
    await updateDoc(refDoc, { comments: arrayUnion(comment) });
    setCommentInputs((s) => ({ ...s, [post.id]: "" }));
  };

  const handleMessageAuthor = (post: Post) => {
    if (!post.authorId) return;
    navigate(`/messages?to=${encodeURIComponent(post.authorId)}`);
  };

  const handleShare = (post: Post) => {
    // Minimal stub
    alert(`Share post by ${post.authorName} with your connections (stub).`);
  };

  const handleAdminDelete = async (post: Post) => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) return;
    const reason = prompt("Reason for deletion (required):");
    if (!reason) return;
    // In a full solution, we'd write moderation record. For now, just delete the post.
    await deleteDoc(doc(db, "posts", post.id));
    alert(`Post deleted. Reason: ${reason}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <p className="text-muted-foreground">
          Stay connected with the alumni community
        </p>
      </div>

      {/* Create Post */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.split(" ").map((n) => n[0]).join("") ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Share something with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept={uploadType === "image" ? "image/*" : uploadType === "video" ? "video/*" : undefined} />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => handlePickMedia("image")}>
                <Image className="h-4 w-4 mr-2" />
                Photo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handlePickMedia("video")}>
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setUploadType("article")}>
                <FileText className="h-4 w-4 mr-2" />
                Article
              </Button>
            </div>
            <Button size="sm" onClick={handleCreatePost} disabled={!user}>
              <Send className="h-4 w-4 mr-2" />
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed (single post in real time) */}
      <div className="space-y-4">
        {posts.map((post) => {
          const pinnedFirst = [...(post.comments || [])].sort((a, b) => (a.isAuthor === b.isAuthor ? 0 : a.isAuthor ? -1 : 1));
          const liked = userLiked(post.id);
          return (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                {/* Post Header */}
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                    <AvatarFallback>{post.authorName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{post.authorName}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {post.authorRole}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        if (!post.createdAt) return "Just now";
                        const d = post.createdAt instanceof Timestamp ? post.createdAt.toDate() : new Date(post.createdAt as any);
                        return d.toLocaleString();
                      })()}
                    </p>
                  </div>
                  {(user?.role === "admin" || user?.role === "super_admin") && (
                    <Button size="icon" variant="ghost" onClick={() => handleAdminDelete(post)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Post Content */}
                {post.content && <p className="text-sm leading-relaxed">{post.content}</p>}

                {/* Media */}
                {post.mediaUrl && post.mediaType === "image" && (
                  <img src={post.mediaUrl} alt="Post content" className="rounded-lg w-full object-cover max-h-96" />
                )}
                {post.mediaUrl && post.mediaType === "video" && (
                  <video controls className="rounded-lg w-full max-h-96">
                    <source src={post.mediaUrl} />
                  </video>
                )}
                {post.mediaType === "article" && post.mediaUrl && (
                  <a href={post.mediaUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open article</a>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant={liked ? "default" : "ghost"}
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleLike(post)}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{post.likes?.length ?? 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleMessageAuthor(post)}>
                      <MessageSquareText className="h-4 w-4" />
                      Message
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleShare(post)}>
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-3">
                  {pinnedFirst.map((c) => (
                    <div key={c.id} className="flex gap-2 items-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{c.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.userName}</span>
                          {c.isAuthor && (
                            <Badge variant="secondary" className="text-[10px]">Author</Badge>
                          )}
                        </div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <div className="flex gap-3 pt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea 
                      placeholder="Write a comment..." 
                      className="min-h-[60px] resize-none"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs((s) => ({ ...s, [post.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => handleAddComment(post)} disabled={!user}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
