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
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  content: string;
  mediaType?: "image" | "video" | "article";
  mediaUrl?: string;
  isDummy?: boolean;
  likes: string[]; // userIds
  comments: { id: string; userId: string; userName: string; isAuthor: boolean; text: string; createdAt?: any }[];
  createdAt?: Timestamp;
};

export function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [dummy, setDummy] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"image" | "video" | "article" | undefined>(undefined);
  const [articleUrl, setArticleUrl] = useState<string>("");
  const [articleOpen, setArticleOpen] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const cloudFolder = import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined;

  async function uploadToCloudinary(file: File, type: "image" | "video") {
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured");
    const resource = type === "video" ? "video" : "image";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    if (cloudFolder) {
      fd.append("folder", cloudFolder);
    }
    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url as string;
  }

  // Subscribe to single dummy post; create if missing (not as current user)
  useEffect(() => {
    const unsubDummy = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20)),
      async (snap) => {
        // find existing dummy
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Post[];
        const found = docs.find((p) => p.isDummy);
        if (!found) {
          // create one generic dummy authored by "Alumni Community"
          await addDoc(collection(db, "posts"), {
            isDummy: true,
            authorId: "alum_bot",
            authorName: "Alumni Community",
            authorAvatar: "/placeholder.svg",
            authorRole: "alumni",
            content: "Welcome to the community! Share your first post.",
            mediaType: null,
            mediaUrl: null,
            likes: [],
            comments: [],
            createdAt: serverTimestamp(),
          });
          setDummy(null);
        } else {
          setDummy(found);
        }
      }
    );
    return () => {
      unsubDummy();
    };
  }, []);

  // Subscribe to real posts (exclude dummy client-side), show latest 10
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const items: Post[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const real = items.filter((p) => !p.isDummy);
      setPosts(real);
    });
    return () => unsub();
  }, []);

  const userLiked = useMemo(() => {
    if (!user) return (postId: string) => false;
    return (postId: string) => posts.find((p) => p.id === postId)?.likes.includes(user.id) ?? false;
  }, [posts, user]);

  const handlePickMedia = (type: "image" | "video" | "article") => {
    setUploadType(type);
    if (type === "article") {
      setArticleOpen(true);
      return; // handled via dialog
    }
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
    if (!newPost.trim() && !uploadFile && !articleUrl) return;
    setPosting(true);
    let mediaUrl: string | undefined;
    try {
      if (uploadFile && uploadType && uploadType !== "article") {
        mediaUrl = await uploadToCloudinary(uploadFile, uploadType);
      }
      if (uploadType === "article" && articleUrl) {
        mediaUrl = articleUrl;
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

      toast({ title: "Posted", description: "Your post is live." });
      setNewPost("");
      setUploadFile(null);
      setUploadType(undefined);
      setArticleUrl("");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to post", description: e?.message || "Please try again.", variant: "destructive" as any });
    } finally {
      setPosting(false);
    }
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
    const template = "I liked the content you shared on your post.";
    navigate(`/messages?to=${encodeURIComponent(post.authorId)}&toName=${encodeURIComponent(post.authorName)}&template=${encodeURIComponent(template)}`);
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
              {/* Local preview before upload */}
              {uploadFile && uploadType === "image" && (
                <img src={URL.createObjectURL(uploadFile)} alt="preview" className="mt-3 rounded-md max-h-60 object-cover" />
              )}
              {uploadFile && uploadType === "video" && (
                <video className="mt-3 rounded-md max-h-60" controls>
                  <source src={URL.createObjectURL(uploadFile)} />
                </video>
              )}
              {uploadType === "article" && articleUrl && (
                <a href={articleUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-primary underline">{articleUrl}</a>
              )}
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
              <Button size="sm" variant="ghost" onClick={() => handlePickMedia("article")}>
                <FileText className="h-4 w-4 mr-2" />
                Article
              </Button>
            </div>
            <Button size="sm" onClick={handleCreatePost} disabled={!user || posting}>
              <Send className="h-4 w-4 mr-2" />
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Article URL Dialog */}
      <Dialog open={articleOpen} onOpenChange={setArticleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add article link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="https://example.com/article"
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              type="url"
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">Paste a valid URL to attach as an article.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setArticleOpen(false); setArticleUrl(""); }}>Cancel</Button>
            <Button onClick={() => {
              const ok = /^https?:\/\//i.test(articleUrl.trim());
              if (!ok) {
                toast({ title: "Invalid URL", description: "Please enter a valid http(s) URL.", variant: "destructive" as any });
                return;
              }
              setArticleOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feed: show dummy (if any) + latest real posts */}
      <div className="space-y-4">
        {dummy && (
          <Card key={dummy.id} className="hover:shadow-md transition-shadow border-dashed">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={dummy.authorAvatar} alt={dummy.authorName} />
                  <AvatarFallback>{dummy.authorName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{dummy.authorName}</h3>
                    <Badge variant="secondary" className="text-xs">{dummy.authorRole}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      if (!dummy.createdAt) return "Just now";
                      const d = dummy.createdAt instanceof Timestamp ? dummy.createdAt.toDate() : new Date(dummy.createdAt as any);
                      return d.toLocaleString();
                    })()}
                  </p>
                </div>
              </div>
              {dummy.content && <p className="text-sm leading-relaxed">{dummy.content}</p>}
            </CardContent>
          </Card>
        )}
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

