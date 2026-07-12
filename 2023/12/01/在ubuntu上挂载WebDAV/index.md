---
title: 在ubuntu上挂载WebDAV
---

# WebDAV挂载

## 安装

 |

```
apt install davfs2

```

## 挂载

 |

```
sed -i 's/# use_locks       1/use_locks       0/g' /etc/davfs2/davfs2.conf

```

- 保存用户名密码，以后挂载的时候不会要求输入用户名密码！ |

```
echo "你的WebDAV地址 用户名 密码" >> /etc/davfs2/secrets

```

 |

```
mount -t davfs https://ena.teracloud.jp/dav/ /TeraCloud

```

- 注意：挂载目录TeraCloud必须提前创建好

## 可能遇到的报错

 |

```
报错 /sbin/mount.davfs:user <username> must be member of group davfs2

```

- 这个错误提示意味着在尝试使用 `mount.davfs` 工具挂载 WebDAV 文件共享时，当前用户 不属于 `davfs2` 用户组。在使用 `mount.davfs` 工具挂载 WebDAV 文件共享时，需要具有足够的权限才能访问 WebDAV 服务器上的共享资源，因此必须将当前用户添加到 `davfs2` 用户组中。

1.

确认用户帐户 还没有属于 `davfs2` 用户组。

 |

```
groups ldh

```

2.

如果 `davfs2` 不在当前用户的用户组列表中，则需要将其添加到该列表中。

  |

```
sudo usermod -a -G davfs2 ldh

```

3.

重新登录以使更改生效。可以注销并重新登录，也可以使用以下命令重新启动 `mount.davfs` 以使更改生效：

 |

```
sudo systemctl restart davfs2

```

现在，可以使用 `mount.davfs` 工具挂载 WebDAV 文件共享了。
